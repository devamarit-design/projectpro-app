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

        const q = query(
            collection(db, "organizations", currentOrgId, "posts"),
            orderBy("createdAt", "desc"),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(prev => {
                let newPosts = [...prev]
                snapshot.docChanges().forEach((change) => {
                    const data = { ...change.doc.data(), id: change.doc.id, orgId: currentOrgId } as Post
                    if (change.type === "added") {
                        if (!newPosts.find(p => p.id === data.id)) newPosts.unshift(data)
                    }
                    if (change.type === "modified") {
                        const index = newPosts.findIndex(p => p.id === data.id)
                        if (index > -1) newPosts[index] = data
                    }
                    if (change.type === "removed") {
                        newPosts = newPosts.filter(p => p.id !== data.id)
                    }
                })
                return newPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            })
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrgId])

    const addPost = useCallback(async (content: string, mediaUrls: string[] = [], mediaType: 'image' | 'video' | 'none' = 'none') => {
        if (!currentOrgId || !currentUser) return

        const tempId = `temp-${Date.now()}`
        const newPost: Post = {
            id: tempId,
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

        setPosts(prev => [newPost, ...prev])

        try {
            const payload = { ...newPost }; delete (payload as any).id; delete (payload as any).orgId
            const docRef = await addDoc(collection(db, "organizations", currentOrgId, "posts"), payload)
            return docRef.id
        } catch (e) {
            console.error("Error adding post", e)
            setPosts(prev => prev.filter(p => p.id !== tempId))
            return undefined
        }
    }, [currentOrgId, currentUser])

    const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
        if (!currentOrgId) return
        const original = [...posts]
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
        try {
            await updateDoc(doc(db, "organizations", currentOrgId, "posts", postId), updates)
        } catch (e) {
            setPosts(original)
        }
    }, [posts, currentOrgId])

    const deletePost = useCallback(async (postId: string) => {
        if (!currentOrgId) return
        const original = [...posts]
        setPosts(prev => prev.filter(p => p.id !== postId))
        try {
            await deleteDoc(doc(db, "organizations", currentOrgId, "posts", postId))
        } catch (e) {
            setPosts(original)
        }
    }, [posts, currentOrgId])

    const toggleLike = useCallback(async (postId: string) => {
        if (!currentOrgId || !currentUser) return
        const post = posts.find(p => p.id === postId)
        if (!post) return

        const userId = currentUser.id
        const isLiked = post.likes.includes(userId)
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
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: post.likes } : p))
        }
    }, [posts, currentOrgId])

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
