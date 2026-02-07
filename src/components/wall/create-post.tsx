"use client"

import { useState, useRef } from "react"
import { Image as ImageIcon, Video, Send, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"

import { useSocial } from "@/context/social-context"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function CreatePost() {
    const { currentUser } = useProjects()
    const { currentOrg } = useOrganization()
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<File[]>([])
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // If video, only allow one
        if (type === 'video') {
            const file = files[0]
            if (file.size > 50 * 1024 * 1024) { // 50MB limit for video
                toast.error("Video is too large (Max 50MB)")
                return
            }
            setMediaFiles([file])
            setMediaType('video')
            const reader = new FileReader()
            reader.onloadend = () => {
                setMediaPreviews([reader.result as string])
            }
            reader.readAsDataURL(file)
            return
        }

        // For images, allow multiple (up to 10)
        const newFiles = [...mediaFiles, ...files].slice(0, 10)
        setMediaFiles(newFiles)
        setMediaType('image')

        const newPreviews: string[] = []
        let processed = 0

        files.forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (Max 20MB)`)
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                newPreviews.push(reader.result as string)
                processed++
                if (processed === files.length) {
                    setMediaPreviews(prev => [...prev, ...newPreviews].slice(0, 10))
                }
            }
            reader.readAsDataURL(file)
        })
    }

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index))
        setMediaPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const { addPost } = useSocial()

    // ... (media handling logic remains same)

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) return
        if (!currentOrg || !currentUser) return

        setIsSubmitting(true)
        try {
            let mediaUrls: string[] = []

            if (mediaFiles.length > 0) {
                const uploadPromises = mediaFiles.map(async (file) => {
                    let fileToUpload = file

                    // Compress image if it is an image
                    if (file.type.startsWith('image/')) {
                        const { compressImage } = await import('@/lib/image-utils');
                        fileToUpload = await compressImage(file);
                    }

                    // Sanitize file name
                    const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const storageRef = ref(storage, `organizations/${currentOrg.id}/posts/${Date.now()}_${sanitizedFileName}`)
                    const snapshot = await uploadBytes(storageRef, fileToUpload)
                    return getDownloadURL(snapshot.ref)
                })

                mediaUrls = await Promise.all(uploadPromises)
            }

            // Use SocialContext's addPost for optimistic update
            // Note: addPost handles the Firestore addDoc internally
            await addPost(content, mediaUrls, mediaFiles.length > 0 ? mediaType : 'none')

            // Always unblock if we get here
            setContent("")
            setMediaFiles([])
            setMediaPreviews([])
            toast.success("Post created!")

        } catch (error) {
            console.error("Error creating post:", error)
            toast.error("Failed to post") // Context handles rollback, but we notify user
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

                    {mediaPreviews.length > 0 && (
                        <div className={cn(
                            "grid gap-2",
                            mediaPreviews.length === 1 ? "grid-cols-1" :
                                mediaPreviews.length === 2 ? "grid-cols-2" :
                                    "grid-cols-3"
                        )}>
                            {mediaPreviews.map((preview, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden bg-muted aspect-square group border border-border">
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-1 right-1 h-5 w-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0"
                                        onClick={() => removeMedia(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                    {mediaType === 'image' ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <video src={preview} className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
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
                            disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
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
