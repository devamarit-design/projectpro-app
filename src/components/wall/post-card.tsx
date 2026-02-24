"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, MoreHorizontal, Share2, Play, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProjects } from "@/context/project-context"

import { useSocial } from "@/context/social-context"
import Image from "next/image"
import { CommentSection } from "./comment-section"
import { Lightbox } from "@/components/ui/lightbox"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"


export interface Post {
    id: string
    content: string
    mediaUrls?: string[]
    mediaType?: 'image' | 'video' | 'none'
    author: {
        id: string
        name: string
        avatar?: string
    }
    likes: string[] // User IDs (Legacy)
    reactions?: Record<string, string[]> // Emoji -> User IDs
    commentsCount: number
    createdAt: string
    updatedAt?: string // Added optional field
    orgId: string
    pending?: boolean
}

interface PostCardProps {
    post: Post
}

export function PostCard({ post }: PostCardProps) {
    const { toggleReaction, deletePost, updatePost } = useSocial()
    const { currentUser, users } = useProjects()

    // Emojis configuration
    const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

    // Reaction mappings
    const currentReactions = post.reactions || {}
    // Backward compatibility: mix legacy likes into 👍
    if (post.likes?.length && !currentReactions["👍"]) {
        currentReactions["👍"] = post.likes
    } else if (post.likes?.length) {
        // Merge them nicely
        currentReactions["👍"] = Array.from(new Set([...currentReactions["👍"], ...post.likes]))
    }

    const hasAnyReaction = Object.values(currentReactions).some(users => users.includes(currentUser?.id || ""))

    // Total aggregated counts
    let totalReactionsCount = 0
    const reactionSummary: Record<string, number> = {}

    Object.entries(currentReactions).forEach(([emoji, userIds]) => {
        if (userIds.length > 0) {
            reactionSummary[emoji] = userIds.length
            totalReactionsCount += userIds.length
        }
    })

    // Prepare likers for the unified user list
    const allLikersSet = new Set<string>()
    Object.values(currentReactions).forEach(userIds => {
        userIds.forEach(id => allLikersSet.add(id))
    })
    const likers = users.filter(user => allLikersSet.has(user.id))


    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)

    // Sync state with props when post updates from Firestore onSnapshot
    useEffect(() => {
        setCommentsCount(post.commentsCount || 0)
    }, [post.commentsCount])

    const [showComments, setShowComments] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Lightbox & Likes Modal
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState("")
    const [showLikesModal, setShowLikesModal] = useState(false)

    // Permission: Author Only
    const isAuthor = currentUser?.id === post.author.id
    const canEdit = isAuthor

    const handleReaction = async (emoji: string) => {
        if (!currentUser) return

        // Optimistic UI updates are handled by the Context
        await toggleReaction(post.id, emoji)

        // Find if we are adding a reaction (not removing it)
        const isCurrentlyReacted = currentReactions[emoji]?.includes(currentUser.id)

        // Notify Author if it is a NEW reaction and we are not the author
        if (!isCurrentlyReacted && post.author.id !== currentUser.id) {
            try {
                const targetId = post.author.id
                const { collection, addDoc } = await import("firebase/firestore")
                const { db } = await import("@/lib/firebase")

                await addDoc(collection(db, "notifications"), {
                    title: `New Reaction ${emoji}`,
                    message: `${currentUser.name} reacted with ${emoji} to your post`,
                    type: "info",
                    date: new Date().toISOString(),
                    read: false,
                    link: `/wall?postId=${post.id}`,
                    relatedId: post.id,
                    target: targetId,
                    orgId: post.orgId,
                    creatorId: currentUser.id
                })
            } catch (error) {
                console.error("Failed to create notification for reaction", error)
            }
        }
    }

    const handleDelete = async () => {
        setIsSaving(true)
        try {
            await deletePost(post.id)
        } catch (err) {
            console.error("Failed to delete post:", err)
            setIsSaving(false) // Only stop saving if failed, otherwise component might unmount
        } finally {
            setShowDeleteAlert(false)
        }
    }

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return
        setIsSaving(true)
        try {
            // Note: updatedAt might not be in the Post interface defined locally or in context?
            // Let's check Post interface. It serves as our contract.
            // If it's missing, we ignore it or just update content.
            // Assuming SocialContext's updatePost accepts Partial<Post> and Post interface has updatedAt (string).
            await updatePost(post.id, {
                content: editContent,
                // @ts-ignore - updatedAt might be optional or missing in interface but good for DB
                updatedAt: new Date().toISOString()
            })
            setIsEditing(false)
        } catch (err) {
            console.error("Failed to update post:", err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{post.author.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                {post.pending && <span className="text-[10px] text-primary animate-pulse">(Sending...)</span>}
                            </p>
                        </div>
                    </div>

                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                    onClick={() => setShowDeleteAlert(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Content */}
                <div className="px-4 pb-4 space-y-4">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[100px] bg-muted/50"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {post.content && (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                            )}

                            {/* Media Grid / Album Layout */}
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <div className="rounded-xl overflow-hidden bg-muted/30 border border-border/50">
                                    {post.mediaType === 'video' ? (
                                        <div className="aspect-video relative bg-black">
                                            <video src={post.mediaUrls[0]} controls className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "grid gap-1",
                                            post.mediaUrls.length === 1 && "grid-cols-1",
                                            post.mediaUrls.length === 2 && "grid-cols-2 aspect-[16/9]",
                                            post.mediaUrls.length === 3 && "grid-cols-2 aspect-[4/3]",
                                            post.mediaUrls.length === 4 && "grid-cols-2 aspect-square",
                                            post.mediaUrls.length >= 5 && "grid-cols-6 aspect-square"
                                        )}>
                                            {post.mediaUrls.length === 1 && (
                                                <div
                                                    className="relative w-full cursor-pointer hover:opacity-95 transition-opacity min-h-[300px]"
                                                    onClick={() => {
                                                        setLightboxSrc(post.mediaUrls![0])
                                                        setLightboxOpen(true)
                                                    }}
                                                >
                                                    <Image
                                                        src={post.mediaUrls[0]}
                                                        alt="Post attachment"
                                                        width={800}
                                                        height={600}
                                                        className="w-full h-auto max-h-[600px] object-cover"
                                                    />
                                                </div>
                                            )}

                                            {post.mediaUrls.length === 2 && post.mediaUrls.map((url, i) => (
                                                <div
                                                    key={i}
                                                    className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all overflow-hidden"
                                                    onClick={() => {
                                                        setLightboxSrc(url)
                                                        setLightboxOpen(true)
                                                    }}
                                                >
                                                    <Image src={url} alt="" fill className="object-cover" />
                                                </div>
                                            ))}

                                            {post.mediaUrls.length === 3 && (
                                                <>
                                                    <div
                                                        className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all row-span-2 overflow-hidden"
                                                        onClick={() => {
                                                            setLightboxSrc(post.mediaUrls![0])
                                                            setLightboxOpen(true)
                                                        }}
                                                    >
                                                        <Image src={post.mediaUrls[0]} alt="" fill className="object-cover" />
                                                    </div>
                                                    <div className="grid grid-rows-2 gap-1 h-full">
                                                        {[1, 2].map((i) => (
                                                            <div
                                                                key={i}
                                                                className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all overflow-hidden"
                                                                onClick={() => {
                                                                    setLightboxSrc(post.mediaUrls![i])
                                                                    setLightboxOpen(true)
                                                                }}
                                                            >
                                                                <Image src={post.mediaUrls![i]} alt="" fill className="object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {post.mediaUrls.length === 4 && post.mediaUrls.map((url, i) => (
                                                <div
                                                    key={i}
                                                    className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all overflow-hidden"
                                                    onClick={() => {
                                                        setLightboxSrc(url)
                                                        setLightboxOpen(true)
                                                    }}
                                                >
                                                    <Image src={url} alt="" fill className="object-cover" />
                                                </div>
                                            ))}

                                            {post.mediaUrls.length >= 5 && (
                                                <>
                                                    {/* Top row: 2 images */}
                                                    {post.mediaUrls.slice(0, 2).map((url, i) => (
                                                        <div
                                                            key={i}
                                                            className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all col-span-3 row-span-3 overflow-hidden"
                                                            onClick={() => {
                                                                setLightboxSrc(url)
                                                                setLightboxOpen(true)
                                                            }}
                                                        >
                                                            <Image src={url} alt="" fill className="object-cover" />
                                                        </div>
                                                    ))}
                                                    {/* Bottom row: 3 images */}
                                                    {post.mediaUrls.slice(2, 5).map((url, i) => (
                                                        <div
                                                            key={i + 2}
                                                            className="relative w-full h-full cursor-pointer hover:opacity-95 transition-all col-span-2 row-span-3 overflow-hidden"
                                                            onClick={() => {
                                                                setLightboxSrc(url)
                                                                setLightboxOpen(true)
                                                            }}
                                                        >
                                                            <Image src={url} alt="" fill className="object-cover" />
                                                            {i === 2 && post.mediaUrls!.length > 5 && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                                                    <span className="text-white text-2xl font-bold">+{post.mediaUrls!.length - 5}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HoverCard openDelay={200} closeDelay={300}>
                            <HoverCardTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="relative flex items-center gap-1.5 hover:bg-muted/50"
                                    onClick={() => handleReaction("👍")}
                                >
                                    <Heart className={cn("h-4 w-4", hasAnyReaction && "fill-rose-500 text-rose-500")} />
                                </Button>
                            </HoverCardTrigger>
                            <HoverCardContent
                                side="top"
                                align="start"
                                className="w-auto p-1.5 flex gap-1 rounded-full bg-background border shadow-xl"
                            >
                                {EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 p-1.5 focus:outline-none"
                                        title={`React with ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </HoverCardContent>
                        </HoverCard>

                        {/* Reaction Count Display */}
                        {totalReactionsCount > 0 && (
                            <HoverCard openDelay={200}>
                                <HoverCardTrigger asChild>
                                    <button
                                        className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1 focus:outline-none"
                                        onClick={() => setShowLikesModal(true)}
                                    >
                                        {totalReactionsCount} reactions
                                    </button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-0 overflow-hidden bg-[#020617]/95 backdrop-blur-xl border-white/10 text-white rounded-3xl shadow-2xl" side="top" align="start">

                                    <div className="p-1 space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {likers.length > 0 ? likers.map(user => (
                                            <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors group">
                                                <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] text-white font-bold">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate leading-none mb-0.5">{user.name}</p>
                                                    <p className="text-[9px] text-white/40 truncate font-medium">{user.email || "Team Member"}</p>
                                                </div>
                                                {user.id === currentUser?.id && (
                                                    <span className="text-[8px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">You</span>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-white/20 gap-2">
                                                <Heart className="w-8 h-8 stroke-1" />
                                                <p className="text-xs font-bold">No visible likes.</p>
                                            </div>
                                        )}
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        )}

                        {/* Likes Dialog for Mobile/Click */}
                        <Dialog open={showLikesModal} onOpenChange={setShowLikesModal}>
                            <DialogContent className="max-w-xs p-0 overflow-hidden bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white rounded-3xl shadow-2xl">
                                <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                        Liked by
                                    </DialogTitle>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => setShowLikesModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </DialogHeader>
                                {likers.length > 0 ? (
                                    <div className="p-1 space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {Object.entries(currentReactions).flatMap(([emoji, uIdArr]) =>
                                            users.filter(u => uIdArr.includes(u.id)).map(user => (
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
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-3">
                                        <Heart className="w-10 h-10 stroke-1" />
                                        <p className="text-sm font-bold">No visible reactions.</p>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 px-2 hover:bg-blue-500/10 hover:text-blue-500"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">{commentsCount}</span>
                        </Button>
                    </div>
                </div>

                {showComments && (
                    <CommentSection
                        postId={post.id}
                        postAuthorId={post.author.id}
                        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
                    />
                )}
            </div>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your post.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-red-500 hover:bg-red-600">
                            {isSaving ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Lightbox
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
                src={lightboxSrc}
            />
        </>
    )
}
