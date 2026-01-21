"use client"

import { useState, useRef } from "react"
import { useSettings, Banner } from "@/context/settings-context"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Trash2, GripVertical, Image as ImageIcon, Plus, Upload, X } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useProjects } from "@/context/project-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function BannerSettings() {
    const { banners, updateBanners } = useSettings()
    const { currentTeam, currentUser } = useProjects()

    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Owner') {
        return null
    }

    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragEnd = (result: any) => {
        if (!result.destination) return

        const items = Array.from(banners)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Update order field
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index
        }))

        updateBanners(updatedItems)
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !currentTeam) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB")
            return
        }

        setUploading(true)
        try {
            const storageRef = ref(storage, `organizations/${currentTeam.id}/banners/${Date.now()}_${file.name}`)
            const snapshot = await uploadBytes(storageRef, file)
            const url = await getDownloadURL(snapshot.ref)

            const newBanner: Banner = {
                id: crypto.randomUUID(),
                url,
                title: "New Banner",
                description: "",
                active: true,
                order: banners.length
            }

            await updateBanners([...banners, newBanner])
            toast.success("Banner uploaded successfully")
        } catch (error) {
            console.error("Upload failed", error)
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this banner?")) {
            const newBanners = banners.filter(b => b.id !== id)
            updateBanners(newBanners)
        }
    }

    const handleUpdate = (id: string, field: keyof Banner, value: any) => {
        const newBanners = banners.map(b =>
            b.id === id ? { ...b, [field]: value } : b
        )
        updateBanners(newBanners)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Dashboard Banners</h3>
                    <p className="text-sm text-muted-foreground">Manage the sliding banners at the top of your dashboard.</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {uploading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Upload Banner
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">Rec: 1200x400px</p>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="banners">
                    {(provided: any) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3"
                        >
                            {banners.map((banner, index) => (
                                <Draggable key={banner.id} draggableId={banner.id} index={index}>
                                    {(provided: any) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="group bg-card/50 border border-white/5 rounded-xl p-3 flex gap-3 items-start overflow-hidden"
                                        >
                                            <div
                                                {...provided.dragHandleProps}
                                                className="mt-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                            >
                                                <GripVertical className="w-5 h-5" />
                                            </div>

                                            {/* Preview */}
                                            <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-muted relative border border-white/10">
                                                {banner.url ? (
                                                    <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inputs */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={banner.title || ""}
                                                        onChange={(e) => handleUpdate(banner.id, "title", e.target.value)}
                                                        placeholder="Banner Title"
                                                        className="flex-1 min-w-0 bg-background/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 truncate"
                                                    />
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase">Active</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={banner.active}
                                                            onChange={(e) => handleUpdate(banner.id, "active", e.target.checked)}
                                                            className="toggle toggle-primary toggle-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={banner.description || ""}
                                                    onChange={(e) => handleUpdate(banner.id, "description", e.target.value)}
                                                    placeholder="Description (Optional)"
                                                    className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                />
                                            </div>

                                            <button
                                                onClick={() => handleDelete(banner.id)}
                                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {banners.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-muted/5">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground font-medium">No banners yet.</p>
                </div>
            )}
        </div>
    )
}
