"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBackNavigation } from "@/hooks/use-back-navigation"

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info" | "success"
}

import { createPortal } from "react-dom"

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "ยืนยัน",
    message,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
    variant = "warning"
}: ConfirmDialogProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    useBackNavigation(isOpen && mounted, (val) => {
        if (!val) onClose()
    })

    if (!isOpen || !mounted) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const variantStyles = {
        danger: {
            icon: "bg-red-500/10 text-red-500",
            button: "bg-red-500 hover:bg-red-600 text-white"
        },
        warning: {
            icon: "bg-amber-500/10 text-amber-500",
            button: "bg-amber-500 hover:bg-amber-600 text-white"
        },
        info: {
            icon: "bg-blue-500/10 text-blue-500",
            button: "bg-blue-500 hover:bg-blue-600 text-white"
        },
        success: {
            icon: "bg-green-500/10 text-green-500",
            button: "bg-green-500 hover:bg-green-600 text-white"
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm bg-card border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
                <div className="p-6 space-y-4">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-full shrink-0", variantStyles[variant].icon)}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold">{title}</h3>
                            <p className="text-muted-foreground mt-1">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium border border-white/10 hover:bg-muted/50 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={cn(
                                "px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg",
                                variantStyles[variant].button
                            )}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
