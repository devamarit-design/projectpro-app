import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * Trigger: When a new post is created in the wall
 * Goal: Notify EVERYONE in the organization
 */
export const onPostCreated = functions
    .region('asia-southeast1')
    .firestore.document('organizations/{orgId}/posts/{postId}')
    .onCreate(async (snap, context) => {
        const db = admin.firestore()
        const messaging = admin.messaging()

        const post = snap.data()
        const { orgId } = context.params
        const authorId = post.author.id
        const authorName = post.author.name || 'someone'

        console.log(`New post by ${authorName} in org ${orgId}`)

        try {
            // 1. Get all users in this organization
            // Assuming users have 'orgIds' array or 'organizations' array
            // We'll query 'users' collection where 'orgIds' array-contains orgId
            const usersSnap = await db.collection('users')
                .where('orgIds', 'array-contains', orgId)
                .get()

            if (usersSnap.empty) {
                console.log('No users to notify')
                return null
            }

            const tokens: string[] = []

            usersSnap.forEach(doc => {
                // Don't notify the author
                if (doc.id === authorId) return

                const userData = doc.data()
                if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                    tokens.push(...userData.fcmTokens)
                }
            })

            if (tokens.length === 0) return null

            // Deduplicate tokens
            const uniqueTokens = [...new Set(tokens)]

            // Create In-App Notification (One doc for everyone)
            await db.collection('notifications').add({
                title: `New Post from ${authorName}`,
                message: post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : 'Shared a photo/video',
                type: 'info',
                date: new Date().toISOString(),
                read: false,
                link: `/wall?postId=${context.params.postId}`,
                relatedId: context.params.postId,
                target: 'all',
                orgId: orgId,
                creatorId: authorId,
                creatorName: authorName
            })

            // Batch send (max 500 per batch, simple split)
            const batches = []
            const batchSize = 500
            for (let i = 0; i < uniqueTokens.length; i += batchSize) {
                const batchTokens = uniqueTokens.slice(i, i + batchSize)

                const payload: admin.messaging.MulticastMessage = {
                    tokens: batchTokens,
                    notification: {
                        title: `New Post from ${authorName} 📢`,
                        body: post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : 'Shared a photo/video',
                    },
                    data: {
                        type: 'WALL_POST',
                        postId: context.params.postId,
                        orgId: orgId,
                        url: `/wall?postId=${context.params.postId}`
                    },
                    android: { notification: { icon: 'stock_ticker_update', color: '#2196f3' } },
                    apns: { payload: { aps: { badge: 1, sound: 'default' } } },
                    webpush: {
                        fcmOptions: {
                            link: `/wall?postId=${context.params.postId}`
                        }
                    }
                }
                batches.push(messaging.sendEachForMulticast(payload))
            }

            await Promise.all(batches)
            console.log(`Sent post notification to ${uniqueTokens.length} devices`)
            return { success: true }

        } catch (error) {
            console.error("Error creating post notification", error)
            return null
        }
    })

/**
 * Trigger: When a post is Updated (checking for Likes)
 * Goal: Notify Post Author
 */
export const onPostLike = functions
    .region('asia-southeast1')
    .firestore.document('organizations/{orgId}/posts/{postId}')
    .onUpdate(async (change, context) => {
        const db = admin.firestore()
        const messaging = admin.messaging()

        const newData = change.after.data()
        const oldData = change.before.data()

        const newLikes = newData.likes || []
        const oldLikes = oldData.likes || []

        if (newLikes.length <= oldLikes.length) return null // Only notify on new Like

        // Find the new liker
        const addedLikerId = newLikes.find((id: string) => !oldLikes.includes(id))
        if (!addedLikerId) return null

        // Don't notify if author liked their own post
        const authorId = newData.author.id
        if (addedLikerId === authorId) return null

        console.log(`Post liked by ${addedLikerId}`)

        try {
            // Get Liker Name
            const likerDoc = await db.collection('users').doc(addedLikerId).get()
            const likerName = likerDoc.exists ? (likerDoc.data()?.name || 'Someone') : 'Someone'

            // Get Author Tokens
            const authorDoc = await db.collection('users').doc(authorId).get()
            if (!authorDoc.exists) return null

            const tokens = authorDoc.data()?.fcmTokens as string[]
            if (!tokens || tokens.length === 0) return null

            // Create In-App Notification for Author
            await db.collection('notifications').add({
                title: `New Like ❤️`,
                message: `${likerName} liked your post`,
                type: 'info',
                date: new Date().toISOString(),
                read: false,
                link: `/wall?postId=${context.params.postId}`,
                relatedId: context.params.postId,
                target: authorId, // Target specific user
                orgId: context.params.orgId,
                creatorId: addedLikerId
            })

            const payload: admin.messaging.MulticastMessage = {
                tokens: tokens,
                notification: {
                    title: 'New Like ❤️',
                    body: `${likerName} liked your post`,
                },
                data: {
                    type: 'POST_LIKE',
                    postId: context.params.postId,
                    orgId: context.params.orgId,
                    url: `/wall?postId=${context.params.postId}`
                },
                android: { notification: { icon: 'stock_ticker_update', color: '#e91e63' } },
                apns: { payload: { aps: { badge: 1, sound: 'default' } } },
                webpush: {
                    fcmOptions: {
                        link: `/wall?postId=${context.params.postId}`
                    }
                }
            }

            await messaging.sendEachForMulticast(payload)
            return { success: true }

        } catch (error) {
            console.error("Error sending like notification", error)
            return null
        }
    })

/**
 * Trigger: When a comment is created
 * Goal: Notify Post Author (and maybe others in thread? For now just author)
 */
export const onCommentCreated = functions
    .region('asia-southeast1')
    .firestore.document('organizations/{orgId}/posts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const db = admin.firestore()
        const messaging = admin.messaging()

        const comment = snap.data()
        const { orgId, postId } = context.params
        const commenterId = comment.userId

        try {
            // Get Post to find Author
            const postRef = db.doc(`organizations/${orgId}/posts/${postId}`)
            const postSnap = await postRef.get()

            if (!postSnap.exists) return null
            const post = postSnap.data()
            const authorId = post?.author?.id

            // Don't notify if commenting on own post
            if (commenterId === authorId) return null

            console.log(`New comment by ${commenterId} on ${authorId}'s post`)

            // Get Commenter Name
            const commenterDoc = await db.collection('users').doc(commenterId).get()
            const commenterName = commenterDoc.exists ? (commenterDoc.data()?.name || 'Someone') : 'Someone'

            // Get Author Tokens
            const authorDoc = await db.collection('users').doc(authorId).get()
            if (!authorDoc.exists) return null

            const tokens = authorDoc.data()?.fcmTokens as string[]
            if (!tokens || tokens.length === 0) return null

            // Create In-App Notification for Author
            await db.collection('notifications').add({
                title: `New Comment 💬`,
                message: `${commenterName} commented: "${comment.text}"`,
                type: 'info',
                date: new Date().toISOString(),
                read: false,
                link: `/wall?postId=${postId}`,
                relatedId: postId,
                target: authorId,
                orgId: orgId,
                creatorId: commenterId
            })

            const payload: admin.messaging.MulticastMessage = {
                tokens: tokens,
                notification: {
                    title: 'New Comment 💬',
                    body: `${commenterName} commented: "${comment.text}"`,
                },
                data: {
                    type: 'POST_COMMENT',
                    postId: postId,
                    orgId: orgId,
                    url: `/wall?postId=${postId}`
                },
                android: { notification: { icon: 'stock_ticker_update', color: '#4caf50' } },
                apns: { payload: { aps: { badge: 1, sound: 'default' } } },
                webpush: {
                    fcmOptions: {
                        link: `/wall?postId=${postId}`
                    }
                }
            }

            await messaging.sendEachForMulticast(payload)
            return { success: true }

        } catch (error) {
            console.error("Error sending comment notification", error)
            return null
        }
    })
