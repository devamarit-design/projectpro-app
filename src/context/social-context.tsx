"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"
import { Post } from "@/components/wall/post-card"

interface SocialContextType {
    posts: Post[]
    addPost: (content: string, mediaUrls?: string[], mediaType?: 'image' | 'video' | 'none') => Promise<string | undefined>
    updatePost: (postId: string, updates: Partial<Post>) => Promise<void>
    deletePost: (postId: string) => Promise<void>
    toggleLike: (postId: string) => Promise<void>
    isLoading: boolean
}

const SocialContext = createContext<SocialContextType | undefined>(undefined)

export function SocialProvider({ children, currentUser }: { children: React.ReactNode, currentUser: any }) {
    const { currentOrg } = useOrganization()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const currentOrgId = currentOrg?.id

    // Global Post Listener
    useEffect(() => {
        if (!currentOrgId) return
        setIsLoading(true)

        // Query with server-side sorting for efficiency
        const q = query(
            collection(db, "organizations", currentOrgId, "posts"),
            orderBy("createdAt", "desc"),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                orgId: currentOrgId,
                pending: doc.metadata.hasPendingWrites
            })) as Post[]

            setPosts(fetchedPosts)
            setIsLoading(false)
        }, (error) => {
            console.error("Error fetching posts:", error)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrgId])

    const addPost = useCallback(async (content: string, mediaUrls: string[] = [], mediaType: 'image' | 'video' | 'none' = 'none') => {
        if (!currentOrgId || !currentUser) return undefined

        // removed tempId logic - relying on Firestore SDK optimistic updates

        const newPost: Partial<Post> = {
            content,
            mediaUrls,
            mediaType,
            author: {
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar
            },
            likes: [],
            commentsCount: 0,
            createdAt: new Date().toISOString(),
            orgId: currentOrgId
        }

        try {
            // Firestore SDK will trigger onSnapshot immediately with hasPendingWrites: true
            const docRef = await addDoc(collection(db, "organizations", currentOrgId, "posts"), newPost)

            // Push Notification to ALL users in Organization (except author)
            // Retrieve all users in this org
            // Note: In a large scale app, this should be done via Cloud Functions
            try {
                const { getDocs, query, where, collection } = await import("firebase/firestore")
                const usersRef = collection(db, "users")
                const q = query(usersRef, where("orgIds", "array-contains", currentOrgId))
                const snapshot = await getDocs(q)

                const targetUserIds = snapshot.docs
                    .map(doc => doc.id)
                    .filter(id => id !== currentUser.id)

                if (targetUserIds.length > 0) {
                    fetch('/api/notifications/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userIds: targetUserIds,
                            title: `New Post from ${currentUser.name}`,
                            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                            url: `/social?postId=${docRef.id}`
                        })
                    }).catch(console.error)
                }
            } catch (err) {
                console.error("Error sending post notification:", err)
            }

            return docRef.id
        } catch (e) {
            console.error("Error adding post", e)
            throw e
        }
    }, [currentOrgId, currentUser])

    const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
        if (!currentOrgId) return

        const originalPosts = [...posts]

        // Optimistic Update
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))

        try {
            await updateDoc(doc(db, "organizations", currentOrgId, "posts", postId), updates)
        } catch (e) {
            console.error("Error updating post", e)
            setPosts(originalPosts) // Rollback
            throw e
        }
    }, [posts, currentOrgId])

    const deletePost = useCallback(async (postId: string) => {
        if (!currentOrgId) return

        const originalPosts = [...posts]

        // Optimistic Update
        setPosts(prev => prev.filter(p => p.id !== postId))

        try {
            await deleteDoc(doc(db, "organizations", currentOrgId, "posts", postId))
        } catch (e) {
            console.error("Error deleting post", e)
            setPosts(originalPosts) // Rollback
            throw e
        }
    }, [posts, currentOrgId])

    const toggleLike = useCallback(async (postId: string) => {
        if (!currentOrgId || !currentUser) return

        const post = posts.find(p => p.id === postId)
        if (!post) return

        const userId = currentUser.id
        const isLiked = post.likes.includes(userId)

        const originalPosts = [...posts]

        // Optimistic Update
        const newLikes = isLiked
            ? post.likes.filter(id => id !== userId)
            : [...post.likes, userId]

        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p))

        try {
            const postRef = doc(db, "organizations", currentOrgId, "posts", postId)
            await updateDoc(postRef, {
                likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
            })
        } catch (e) {
            console.error("Error toggling like", e)
            setPosts(originalPosts) // Rollback
        }
    }, [posts, currentOrgId, currentUser])

    const value = useMemo(() => ({
        posts, addPost, updatePost, deletePost, toggleLike, isLoading
    }), [posts, addPost, updatePost, deletePost, toggleLike, isLoading])

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    )
}

export function useSocial() {
    const context = useContext(SocialContext)
    if (context === undefined) throw new Error("useSocial must be used within a SocialProvider")
    return context
}
