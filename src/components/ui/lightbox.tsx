"use client"

import * as React from "react"
import { X, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBackNavigation } from "@/hooks/use-back-navigation"
import Image from "next/image"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

interface LightboxProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    src: string
    alt?: string
}

export function Lightbox({ open, onOpenChange, src, alt }: LightboxProps) {
    useBackNavigation(
        open,
        (val) => onOpenChange(val),
        `lightbox-${src}` // Use src as part of ID to be specific
    )

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
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Image Container */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={4}
                        centerOnInit
                    >
                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
                                <Image
                                    src={src}
                                    alt={alt || "Full screen image"}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                />
                            </div>
                        </TransformComponent>
                    </TransformWrapper>
                </div>
            </DialogContent>
        </Dialog>
    )
}
