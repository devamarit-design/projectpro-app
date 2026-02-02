"use client"

import { useState, useEffect } from "react"
import { useOrganization } from "@/context/organization-context"
import { useProjects } from "@/context/project-context"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Comment {
    id: string
    content: string
    author: {
        id: string
        name: string
        avatar?: string
    }
    createdAt: string
}

interface CommentSectionProps {
    postId: string
    onClose?: () => void
    onCommentAdded?: () => void
}

export function CommentSection({ postId, onClose, onCommentAdded }: CommentSectionProps) {
    const { currentOrg } = useOrganization()
    const { currentUser } = useProjects()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!currentOrg || !postId) return

        const commentsRef = collection(db, "organizations", currentOrg.id, "posts", postId, "comments")
        const q = query(commentsRef, orderBy("createdAt", "asc"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    // Handle Firestore Timestamp or ISO string
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
                }
            }) as Comment[]
            setComments(fetchedComments)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrg, postId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !currentUser || !currentOrg) return

        const commentText = newComment.trim()
        setNewComment("") // Clear input immediately for responsiveness

        // 1. Optimistic Update
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            content: commentText,
            author: {
                id: currentUser.id,
                name: currentUser.name || "Unknown",
                avatar: currentUser.avatar
            },
            createdAt: new Date().toISOString()
        }

        // Add to local state immediately
        setComments(prev => [...prev, optimisticComment])
        setIsSubmitting(true)

        try {
            const commentsRef = collection(db, "organizations", currentOrg.id, "posts", postId, "comments")
            const postRef = doc(db, "organizations", currentOrg.id, "posts", postId)

            // 2. Add to Firestore - Primary Action
            await addDoc(commentsRef, {
                content: commentText,
                author: {
                    id: currentUser.id,
                    name: currentUser.name || "Unknown",
                    avatar: currentUser.avatar
                },
                createdAt: serverTimestamp()
            })

            // 3. Update commentsCount - Secondary Action (don't block the UI if possible)
            updateDoc(postRef, {
                commentsCount: increment(1)
            }).catch(err => console.error("Error updating commentsCount:", err))

            // Trigger callback if provided
            if (onCommentAdded) onCommentAdded()

        } catch (error) {
            console.error("Error adding comment:", error)
            toast.error("Failed to add comment")
            // Rollback optimistic update on error
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
            setNewComment(commentText) // Restore comment text
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-muted/30 border-t border-border p-4 space-y-4">
            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-xs text-center text-muted-foreground py-2">No comments yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 text-sm">
                                    <Avatar className="h-8 w-8 mt-0.5">
                                        <AvatarImage src={comment.author.avatar} />
                                        <AvatarFallback>{comment.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="bg-muted/80 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-[90%]">
                                            <span className="font-semibold text-xs mr-2">{comment.author.name}</span>
                                            <span className="text-foreground/90">{comment.content}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground pl-1">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="relative flex-1">
                    <Input
                        placeholder="Write a comment..."
                        className="pr-10 h-10 rounded-full bg-background border-none ring-1 ring-border/50 focus-visible:ring-primary/50"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}
