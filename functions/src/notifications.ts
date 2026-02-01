import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * Trigger: When a task is created or updated
 * Goal: Send push notification to the assigned user
 */
export const onTaskAssigned = functions
    .region('asia-southeast1')
    .firestore.document('tasks/{taskId}')
    .onWrite(async (change, context) => {
        // Initialize Admin SDK services lazily or ensure app is initialized
        // Note: admin.initializeApp() is called in index.ts, which imports this file.
        // However, accessing services at top-level causes issues if init hasn't happened.
        const db = admin.firestore()
        const messaging = admin.messaging()

        const newData = change.after.exists ? change.after.data() : null
        const oldData = change.before.exists ? change.before.data() : null

        if (!newData) return null // Task deleted

        const newAssigneeId = newData.assignedTo
        const oldAssigneeId = oldData?.assignedTo

        // Condition 1: New Task created with assignee
        // Condition 2: Existing Task updated AND assignee changed
        const isNewAssignment = newAssigneeId && (newAssigneeId !== oldAssigneeId)

        if (!isNewAssignment) {
            return null
        }

        console.log(`Task ${context.params.taskId} assigned to ${newAssigneeId}`)

        try {
            // 1. Get User Profile to find FCM Tokens
            const userDoc = await db.collection('users').doc(newAssigneeId).get()
            if (!userDoc.exists) {
                console.log('Assignee user not found')
                return null
            }

            const userData = userDoc.data()
            const tokens = userData?.fcmTokens as string[]

            if (!tokens || tokens.length === 0) {
                console.log('No FCM tokens registered for user', newAssigneeId)
                return null
            }

            // 2. Get Project Name (Lazy load)
            let projectName = 'General Project'
            if (newData.projectId) {
                const pDoc = await db.collection('projects').doc(newData.projectId).get()
                if (pDoc.exists) {
                    projectName = pDoc.data()?.name || projectName
                }
            }

            // 3. Construct Notification Payload
            const payload: admin.messaging.MulticastMessage = {
                tokens: tokens, // Send to all user's devices
                notification: {
                    title: 'New Task Assigned 📋',
                    body: `You have been assigned to "${newData.title}" in ${projectName}`,
                },
                data: {
                    type: 'TASK_ASSIGNED',
                    taskId: context.params.taskId,
                    projectId: newData.projectId || '',
                    url: `/tasks?taskId=${context.params.taskId}` // For click handling
                },
                // Android specific settings
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#f4511e',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK' // Standard, or handle in SW
                    }
                },
                // Apple specific settings
                apns: {
                    payload: {
                        aps: {
                            badge: 1,
                            sound: 'default'
                        }
                    }
                }
            }

            // 4. Send Message
            const response = await messaging.sendEachForMulticast(payload)

            // Cleanup invalid tokens
            if (response.failureCount > 0) {
                const failedTokens: string[] = []
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx])
                    }
                })

                if (failedTokens.length > 0) {
                    await db.collection('users').doc(newAssigneeId).update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                    })
                    console.log('Removed invalid tokens:', failedTokens)
                }
            }

            console.log('Notification sent:', response.successCount, 'success', response.failureCount, 'failed')
            return { success: true }

        } catch (error) {
            console.error('Error sending push notification:', error)
            return null
        }
    })

/**
 * Trigger: When task status changes (e.g. to Done)
 * Goal: Notify the task creator/owner
 */
export const onTaskStatusChanged = functions
    .region('asia-southeast1')
    .firestore.document('tasks/{taskId}')
    .onUpdate(async (change, context) => {
        const db = admin.firestore()
        const messaging = admin.messaging()

        const newData = change.after.data()
        const oldData = change.before.data()

        const newStatus = newData.status
        const oldStatus = oldData.status

        // Only trigger if status changed and is now 'Done' (or maybe any change?)
        // User asked: "When status changes: Tell owner task is done"
        // Let's focus on "Done" for now, or major status changes.
        if (newStatus === oldStatus) return null

        // If status changed to 'Done', notify createdBy
        if (newStatus === 'Done' && newData.createdBy) {
            const creatorId = newData.createdBy

            // Don't notify if the person who completed it is the creator (self-complete)
            // (context.auth is not available in onUpdate, we'd need 'completedBy' field or similar)
            // For now, just send it.

            console.log(`Task ${context.params.taskId} marked Done. Notifying ${creatorId}`)

            try {
                const userDoc = await db.collection('users').doc(creatorId).get()
                if (!userDoc.exists) return null

                const userData = userDoc.data()
                const tokens = userData?.fcmTokens as string[]

                if (!tokens || tokens.length === 0) return null

                // Get Project Name
                let projectName = 'Project'
                if (newData.projectId) {
                    const p = await db.collection('projects').doc(newData.projectId).get()
                    projectName = p.data()?.name || projectName
                }

                const payload: admin.messaging.MulticastMessage = {
                    tokens: tokens,
                    notification: {
                        title: 'Task Completed ✅',
                        body: `Task "${newData.title}" in ${projectName} is Done!`,
                    },
                    data: {
                        type: 'TASK_COMPLETED',
                        taskId: context.params.taskId,
                        projectId: newData.projectId || '',
                        url: `/tasks?taskId=${context.params.taskId}`
                    },
                    android: { notification: { icon: 'stock_ticker_update', color: '#4caf50' } },
                    apns: { payload: { aps: { badge: 1, sound: 'default' } } }
                }

                await messaging.sendEachForMulticast(payload)
                return { success: true }
            } catch (error) {
                console.error("Error sending status notification", error)
                return null
            }
        }

        return null
    })

/**
 * Trigger: Schedule daily at 9:00 AM
 * Goal: Check due dates and notify assignees
 */
export const checkTaskDueDates = functions
    .region('asia-southeast1')
    .pubsub.schedule('0 9 * * *') // 9:00 AM daily
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        const db = admin.firestore()
        const messaging = admin.messaging()

        console.log('Running daily due date check...')

        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Define range: Tasks due "tomorrow" (or today?)
        // Let's create a range for "Due Soon" (e.g. within 24 hours)
        // Implementation: Query tasks where dueDatestring matches YYYY-MM-DD of tomorrow?
        // Or Query by timestamp range.

        // Assuming dueDate is stored as ISO string or timestamp string
        // Let's scan active tasks and check logic in code for flexibility (if dataset < 10k)
        // Or query properly.

        try {
            const tasksSnap = await db.collection('tasks')
                .where('status', '!=', 'Done')
                .get()

            const notifications: Promise<any>[] = []

            tasksSnap.forEach(doc => {
                const task = doc.data()
                if (!task.dueDate || !task.assignedTo) return

                const dueDate = new Date(task.dueDate)
                const diffTime = dueDate.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                // Notify if due tomorrow (1 day) or today (0 or less but not too late?)
                if (diffDays === 1) { // Tomorrow
                    notifications.push((async () => {
                        const userDoc = await db.collection('users').doc(task.assignedTo).get()
                        if (!userDoc.exists) return

                        const tokens = userDoc.data()?.fcmTokens as string[]
                        if (!tokens?.length) return

                        // Get Project Name
                        let projectName = 'Project'
                        if (task.projectId) {
                            const p = await db.collection('projects').doc(task.projectId).get()
                            projectName = p.data()?.name || projectName
                        }

                        const payload: admin.messaging.MulticastMessage = {
                            tokens: tokens,
                            notification: {
                                title: 'Task Due Soon ⏰',
                                body: `"${task.title}" is due tomorrow!`,
                            },
                            data: {
                                type: 'TASK_DUE',
                                taskId: doc.id,
                                projectId: task.projectId || '',
                                url: `/tasks?taskId=${doc.id}`
                            },
                            android: { notification: { icon: 'stock_ticker_update', color: '#ff9800' } },
                            apns: { payload: { aps: { badge: 1, sound: 'default' } } }
                        }

                        await messaging.sendEachForMulticast(payload)
                    })())
                }
            })

            await Promise.all(notifications)
            console.log(`Sent due date reminders for ${notifications.length} tasks`)
            return null

        } catch (error) {
            console.error("Error checking due dates", error)
            return null
        }
    })
