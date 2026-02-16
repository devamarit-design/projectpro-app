"use client"

import * as React from "react"
import { X, ZoomIn, ZoomOut, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBackNavigation } from "@/hooks/use-back-navigation"

interface LightboxProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    src: string
    alt?: string
}

export function Lightbox({ open, onOpenChange, src, alt }: LightboxProps) {
    const [scale, setScale] = React.useState(1)
    const [rotation, setRotation] = React.useState(0)

    // Reset state when closed
    React.useEffect(() => {
        if (!open) {
            setScale(1)
            setRotation(0)
        }
    }, [open])

    useBackNavigation(
        open,
        (val) => onOpenChange(val),
        `lightbox-${src}` // Use src as part of ID to be specific
    )

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1))

    const handleDownload = async () => {
        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `image-${Date.now()}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Failed to download image:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-screen-xl w-full h-full max-h-screen p-0 bg-black/90 border-none sm:rounded-none overflow-hidden flex flex-col items-center justify-center inset-0 z-[100]">
                {/* Accessible Title (Hidden visual) */}
                <DialogTitle className="sr-only">Image Viewer</DialogTitle>
                <DialogDescription className="sr-only">Full screen image viewer</DialogDescription>

                {/* Toolbar */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={handleZoomOut}>
                        <ZoomOut className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={handleZoomIn}>
                        <ZoomIn className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Image Container */}
                <div
                    className="relative w-full h-full flex items-center justify-center overflow-auto p-4"
                    onClick={() => onOpenChange(false)} // Click outside to close
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt || "Full screen image"}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{
                            transform: `scale(${scale}) rotate(${rotation}deg)`,
                            cursor: scale > 1 ? 'grab' : 'zoom-in'
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            // If not zoomed, zoom in. If zoomed, reset or do nothing?
                            // Let's keep it simple: click image doesn't close
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
