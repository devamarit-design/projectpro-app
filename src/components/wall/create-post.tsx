"use client"

import { useState, useRef } from "react"
import { Image as ImageIcon, Video, Send, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { toast } from "sonner"
import Image from "next/image"

export function CreatePost() {
    const { currentUser } = useProjects()
    const { currentOrg } = useOrganization()
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            toast.error("File is too large (Max 20MB)")
            return
        }

        setMediaFile(file)
        setMediaType(type)

        const reader = new FileReader()
        reader.onloadend = () => {
            setMediaPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async () => {
        if (!content.trim() && !mediaFile) return
        if (!currentOrg || !currentUser) return

        setIsSubmitting(true)
        try {
            let mediaUrls: string[] = []

            if (mediaFile) {
                let fileToUpload = mediaFile

                // Compress image if it is an image
                if (mediaFile.type.startsWith('image/')) {
                    const { compressImage } = await import('@/lib/image-utils');
                    fileToUpload = await compressImage(mediaFile);
                }

                // Sanitize file name
                const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const storageRef = ref(storage, `organizations/${currentOrg.id}/posts/${Date.now()}_${sanitizedFileName}`)
                const snapshot = await uploadBytes(storageRef, fileToUpload)
                const url = await getDownloadURL(snapshot.ref)
                mediaUrls.push(url)
            }

            await addDoc(collection(db, "organizations", currentOrg.id, "posts"), {
                content,
                mediaUrls,
                mediaType: mediaFile ? mediaType : 'none',
                author: {
                    id: currentUser.id,
                    name: currentUser.name || "Unknown",
                    avatar: currentUser.avatar
                },
                likes: [],
                commentsCount: 0,
                createdAt: new Date().toISOString(), // Use ISO string first for immediate local display if needed, but Firestore hook usually handles timestamp
                // Using serverTimestamp() is better for consistency but might need conversion for local display before fetch
                // Let's use string for now as defined in interface, or we interact with Timestamp object.
                // Actually interface says Date string.
            })

            setContent("")
            setMediaFile(null)
            setMediaPreview(null)
            toast.success("Post created!")
        } catch (error) {
            console.error("Error creating post:", error)
            toast.error(error instanceof Error ? error.message : "Failed to post")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.avatar || ""} />
                    <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                    <Textarea
                        placeholder={`What's on your mind, ${currentUser?.name?.split(' ')[0]}?`}
                        className="min-h-[80px] border-none bg-muted/50 focus-visible:ring-0 resize-none p-3 rounded-lg"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {mediaPreview && (
                        <div className="relative rounded-lg overflow-hidden bg-muted max-h-[300px] w-full group">
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    setMediaFile(null)
                                    setMediaPreview(null)
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                            {mediaType === 'image' ? (
                                <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <video src={mediaPreview} controls className="w-full h-full max-h-[300px]" />
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,.heic,.heif"
                                onChange={(e) => handleFileSelect(e, 'image')}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-green-500 gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">Photo</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-red-500 gap-2 relative"
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="video/*"
                                    onChange={(e) => handleFileSelect(e, 'video')}
                                />
                                <Video className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">Video</span>
                            </Button>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && !mediaFile) || isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-white gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Post
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
