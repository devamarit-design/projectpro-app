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
    toggleReaction: (postId: string, emoji: string) => Promise<void>
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
            avatar: currentUser.avatar,
            likes: [], // Legacy
            reactions: {}, // New emoji tracking
            commentsCount: 0,
            createdAt: new Date().toISOString(),

            const userId = currentUser.id
    const currentReactions = post.reactions || {}

    // Remove from all existing emojis (radio-group behavior per post/user)
    // Or keep it multi-select? Let's do multi-select: toggle this specific emoji
    const usersForEmoji = currentReactions[emoji] || []
    const isReacted = usersForEmoji.includes(userId)

    const originalPosts = [...posts]

    // Optimistic Update
    const newUsersForEmoji = isReacted
                ? usersForEmoji.filter(id => id !== userId)
                : [...usersForEmoji, userId]

    const newReactions = {
                ...currentReactions,
                [emoji]: newUsersForEmoji
            }

    // Cleanup empty emoji arrays
    if(newReactions[emoji].length === 0) {
            delete newReactions[emoji]
    }

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: newReactions } : p))

    try {
        const postRef = doc(db, "organizations", currentOrgId, "posts", postId)

        // If the array is empty, we must technically just set it to empty array or delete the field
        // To be safe with Firestore maps, we update the specific key
        await updateDoc(postRef, {
            [`reactions.${emoji}`]: isReacted ? arrayRemove(userId) : arrayUnion(userId)
        })
    } catch (e) {
        console.error("Error toggling reaction", e)
        setPosts(originalPosts) // Rollback
    }
}, [posts, currentOrgId, currentUser])

const value = useMemo(() => ({
    posts, addPost, updatePost, deletePost, toggleLike, toggleReaction, isLoading
}), [posts, addPost, updatePost, deletePost, toggleLike, toggleReaction, isLoading])

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
