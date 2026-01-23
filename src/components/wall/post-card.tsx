"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, MoreHorizontal, Share2, Play, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProjects } from "@/context/project-context"
import { arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"
import { CommentSection } from "./comment-section"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { doc, deleteDoc, updateDoc } from "firebase/firestore"

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
    likes: string[] // User IDs
    commentsCount: number
    createdAt: string
    orgId: string
}

interface PostCardProps {
    post: Post
}

export function PostCard({ post }: PostCardProps) {
    const { currentUser, users } = useProjects()
    const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || ""))
    const [likesCount, setLikesCount] = useState(post.likes.length)
    const [showComments, setShowComments] = useState(false)

    // Edit/Delete State
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Filter likes
    const likers = users.filter(user => post.likes.includes(user.id))

    // Permission: Author Only
    const isAuthor = currentUser?.id === post.author.id
    const canEdit = isAuthor

    const handleLike = async () => {
        if (!currentUser) return
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)
        try {
            const postRef = doc(db, "organizations", post.orgId, "posts", post.id)
            if (newIsLiked) {
                await updateDoc(postRef, { likes: arrayUnion(currentUser.id) })
            } else {
                await updateDoc(postRef, { likes: arrayRemove(currentUser.id) })
            }
        } catch (error) {
            setIsLiked(!newIsLiked)
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
            console.error("Error updating like:", error)
        }
    }

    const handleDelete = async () => {
        setIsSaving(true)
        try {
            await deleteDoc(doc(db, "organizations", post.orgId, "posts", post.id))
        } catch (err) {
            console.error("Failed to delete post:", err)
        } finally {
            setIsSaving(false)
            setShowDeleteAlert(false)
        }
    }

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return
        setIsSaving(true)
        try {
            await updateDoc(doc(db, "organizations", post.orgId, "posts", post.id), {
                content: editContent,
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
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
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

                            {/* Media Grid */}
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <div className={cn(
                                    "rounded-lg overflow-hidden gap-1",
                                    post.mediaUrls.length > 1 ? "grid grid-cols-2" : "block",
                                    post.mediaType === 'video' ? "aspect-video" : ""
                                )}>
                                    {post.mediaUrls.map((url, index) => (
                                        <div key={index} className="relative w-full h-full min-h-[200px] bg-muted">
                                            {post.mediaType === 'video' ? (
                                                <video src={url} controls className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="relative w-full h-full aspect-[4/3]">
                                                    <Image
                                                        src={url}
                                                        alt={`Post attachment ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("gap-2 px-2 hover:bg-red-500/10 hover:text-red-500", isLiked && "text-red-500")}
                                onClick={handleLike}
                            >
                                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                                <span className="text-xs font-medium">{likesCount}</span>
                            </Button>

                            {/* Custom Tooltip */}
                            {post.likes.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                    <div className="bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border p-2 min-w-[120px] max-w-[200px]">
                                        <p className="font-semibold mb-1">Liked by:</p>
                                        <div className="space-y-0.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {likers.length > 0 ? likers.map(user => (
                                                <div key={user.id} className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px]">{user.name.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <span className="truncate">{user.id === currentUser?.id ? "You" : user.name}</span>
                                                </div>
                                            )) : (
                                                <span className="text-muted-foreground italic">Unknown users</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 px-2 hover:bg-blue-500/10 hover:text-blue-500"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">{post.commentsCount || 0}</span>
                        </Button>
                    </div>
                </div>

                {showComments && (
                    <CommentSection postId={post.id} />
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
        </>
    )
}
