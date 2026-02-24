import { useState, useEffect } from "react"
import { useOrganization } from "@/context/organization-context"
import { useProjects } from "@/context/project-context"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { Send, Loader2, Heart, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Comment {
    id: string
    content: string
    author: {
        id: string
        name: string
        avatar?: string
    }
    createdAt: string
    likes?: string[] // User IDs (Legacy)
    reactions?: Record<string, string[]> // Emoji -> User IDs
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface CommentSectionProps {
    postId: string
    postAuthorId?: string
    onClose?: () => void
    onCommentAdded?: () => void
}

export function CommentSection({ postId, postAuthorId, onClose, onCommentAdded }: CommentSectionProps) {
    const { currentOrg } = useOrganization()
    const { currentUser, users } = useProjects()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null)

    // Likers Dialog
    const [showLikersModal, setShowLikersModal] = useState(false)
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
    const [activeLikers, setActiveLikers] = useState<any[]>([])

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
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
                    likes: data.likes || [],
                    reactions: data.reactions || {}
                }
            }) as Comment[]
            setComments(fetchedComments)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentOrg, postId])

    // Update active likers when dialog opens or selected comment changes
    useEffect(() => {
        if (showLikersModal && selectedCommentId) {
            const comment = comments.find(c => c.id === selectedCommentId)
            if (comment && users) {
                // Backward compatibility + Reactions
                let allLikerIds: string[] = []
                if (comment.likes) allLikerIds = [...allLikerIds, ...comment.likes]
                if (comment.reactions) {
                    Object.values(comment.reactions).forEach(userIds => {
                        allLikerIds = [...allLikerIds, ...userIds]
                    })
                }
                const uniqueLikerIds = Array.from(new Set(allLikerIds))
                const likerDetails = users.filter(u => uniqueLikerIds.includes(u.id))
                setActiveLikers(likerDetails)
            } else {
                setActiveLikers([])
            }
        }
    }, [showLikersModal, selectedCommentId, comments, users])

    const handleReactionComment = async (commentId: string, emoji: string) => {
        if (!currentUser || !currentOrg) return

        const comment = comments.find(c => c.id === commentId)
        if (!comment) return

        const currentReactions = comment.reactions || {}
        const usersForEmoji = currentReactions[emoji] || []
        const isReacted = usersForEmoji.includes(currentUser.id)

        const commentRef = doc(db, "organizations", currentOrg.id, "posts", postId, "comments", commentId)

        try {
            // Firestore update logic for maps usually requires merging the whole field if modifying arrays
            const newUsersForEmoji = isReacted
                ? usersForEmoji.filter(id => id !== currentUser.id)
                : [...usersForEmoji, currentUser.id]

            const newReactions = {
                ...currentReactions,
                [emoji]: newUsersForEmoji
            }

            await updateDoc(commentRef, {
                reactions: newReactions
            })

            // Only notify if it's a NEW reaction (not removing sync)
            if (!isReacted && comment.author.id !== currentUser.id) {
                addDoc(collection(db, "notifications"), {
                    title: `New Reaction ${emoji}`,
                    message: `${currentUser.name} reacted with ${emoji} to your comment`,
                    type: "info",
                    date: new Date().toISOString(),
                    read: false,
                    link: `/wall?postId=${postId}`,
                    relatedId: postId,
                    target: comment.author.id,
                    orgId: currentOrg.id,
                    creatorId: currentUser.id
                }).catch(err => console.error("Failed to create reaction notification", err))
            }

        } catch (error) {
            console.error("Error toggling reaction:", error)
            toast.error("Failed to update reaction")
        }
    }

    const openLikersModal = (commentId: string) => {
        setSelectedCommentId(commentId)
        setShowLikersModal(true)
    }

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
            createdAt: new Date().toISOString(),
            likes: []
        }

        // Add to local state immediately
        // Add to local state immediately
        setComments(prev => [...prev, optimisticComment])

        // Do NOT block UI. Let it fly.
        setIsSubmitting(false)

        // Fire and forget (with error handling catch-up)
        const performSave = async () => {
            try {
                const commentsRef = collection(db, "organizations", currentOrg.id, "posts", postId, "comments")
                const postRef = doc(db, "organizations", currentOrg.id, "posts", postId)

                // 2. Add to Firestore with Timeout (Fire and Forget strategy for UI)
                // If quota is exceeded or offline, addDoc waits forever for sync. We race it against a timeout.
                const addPromise = addDoc(commentsRef, {
                    content: commentText,
                    author: {
                        id: currentUser.id,
                        name: currentUser.name || "Unknown",
                        avatar: currentUser.avatar
                    },
                    createdAt: serverTimestamp(),
                    likes: []
                })

                // Wait at most 2 seconds for server confim, otherwise assume success (offline/latched)
                await Promise.race([
                    addPromise,
                    new Promise(resolve => setTimeout(resolve, 2000))
                ])

                // 3. Update commentsCount - Secondary Action (don't block the UI if possible)
                updateDoc(postRef, {
                    commentsCount: increment(1)
                }).catch(err => console.error("Error updating commentsCount:", err))

                // 4. Create Notification if comment is not by author
                if (postAuthorId && postAuthorId !== currentUser.id) {
                    addDoc(collection(db, "notifications"), {
                        title: "New Comment",
                        message: `${currentUser.name} commented on your post`,
                        type: "info",
                        date: new Date().toISOString(),
                        read: false,
                        link: `/wall?postId=${postId}`,
                        relatedId: postId,
                        target: postAuthorId,
                        orgId: currentOrg.id,
                        creatorId: currentUser.id
                    }).catch(err => console.error("Failed to create notification", err))
                }

                // Trigger callback if provided
                if (onCommentAdded) onCommentAdded()

            } catch (error) {
                console.error("Error adding comment:", error)
                // Only show error if it's NOT a timeout/offline assumption
                // In quota case, we largely want to trust the optimistic update
                const isQuotaError = JSON.stringify(error).includes("resource-exhausted") || JSON.stringify(error).includes("Quota exceeded")

                if (!isQuotaError) {
                    toast.error("Failed to add comment")
                    // Rollback optimistic update on real error
                    setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
                    setNewComment(commentText) // Restore comment text
                }
            }
        }

        performSave()
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
                            {comments.map(comment => {
                                // Map legacy likes to 👍 for backward compatibility context
                                const currentReactions = comment.reactions || {}
                                if (comment.likes?.length && !currentReactions["👍"]) {
                                    currentReactions["👍"] = comment.likes
                                } else if (comment.likes?.length) {
                                    currentReactions["👍"] = Array.from(new Set([...currentReactions["👍"], ...comment.likes]))
                                }

                                const hasAnyReaction = Object.values(currentReactions).some(users => users.includes(currentUser?.id || ""))

                                let totalReactionsCount = 0
                                Object.values(currentReactions).forEach(userIds => {
                                    totalReactionsCount += userIds.length
                                })

                                return (
                                    <div key={comment.id} className="flex gap-3 text-sm group">
                                        <Avatar className="h-8 w-8 mt-0.5">
                                            <AvatarImage src={comment.author.avatar} />
                                            <AvatarFallback>{comment.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start gap-2">
                                                <div className="bg-muted/80 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-[90%] relative group/comment">
                                                    <span className="font-semibold text-xs mr-2">{comment.author.name}</span>
                                                    <span className="text-foreground/90">{comment.content}</span>

                                                    {totalReactionsCount > 0 && (
                                                        <button
                                                            onClick={() => openLikersModal(comment.id)}
                                                            className="absolute -bottom-2 -right-1 bg-background border border-border rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm text-[9px] text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
                                                        >
                                                            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                                            <span>{totalReactionsCount}</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 pl-1 mt-0.5">
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </p>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setActiveReactionCommentId(activeReactionCommentId === comment.id ? null : comment.id)}
                                                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            React
                                                        </button>
                                                        {activeReactionCommentId === comment.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-40"
                                                                    onClick={(e) => { e.stopPropagation(); setActiveReactionCommentId(null); }}
                                                                />
                                                                <div className="absolute bottom-full left-0 mb-1 w-auto p-1 flex gap-1 rounded-full bg-background border shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                                                    {EMOJIS.map(emoji => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleReactionComment(comment.id, emoji)
                                                                                setActiveReactionCommentId(null)
                                                                            }}
                                                                            className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 p-1.5 focus:outline-none relative z-50"
                                                                            title={`React with ${emoji}`}
                                                                        >
                                                                            {emoji}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
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

            {/* Likers Dialog */}
            <Dialog open={showLikersModal} onOpenChange={setShowLikersModal}>
                <DialogContent className="max-w-xs p-0 overflow-hidden bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white rounded-3xl shadow-2xl">
                    <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                            Reactions
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => setShowLikersModal(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activeLikers.length > 0 ? (
                            (() => {
                                const selectedComment = comments.find(c => c.id === selectedCommentId)
                                const commentReactions = selectedComment?.reactions || {}
                                if (selectedComment?.likes?.length && !commentReactions["👍"]) {
                                    commentReactions["👍"] = selectedComment.likes
                                } else if (selectedComment?.likes?.length) {
                                    commentReactions["👍"] = Array.from(new Set([...commentReactions["👍"], ...selectedComment.likes]))
                                }

                                return Object.entries(commentReactions).flatMap(([emoji, uIdArr]) =>
                                    activeLikers.filter(u => uIdArr.includes(u.id)).map(user => (
                                        <div key={`${emoji}-${user.id}`} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-2xl transition-colors group">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-xs text-white font-bold">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 bg-black rounded-full border border-white/10 text-[10px] w-5 h-5 flex items-center justify-center">
                                                    {emoji}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-sm font-bold text-white truncate leading-none mb-1">{user.name}</p>
                                                <p className="text-[10px] text-white/40 truncate font-medium">{user.email || "Team Member"}</p>
                                            </div>
                                            {user.id === currentUser?.id && (
                                                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider scale-90">You</span>
                                            )}
                                        </div>
                                    ))
                                )
                            })()
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-3">
                                <Heart className="w-10 h-10 stroke-1" />
                                <p className="text-sm font-bold">No visible reactions.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
