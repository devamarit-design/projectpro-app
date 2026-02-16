"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useBackNavigation } from "@/hooks/use-back-navigation"

const Dialog = ({
    open,
    children,
    onOpenChange,
}: {
    open?: boolean
    children: React.ReactNode
    onOpenChange?: (open: boolean) => void
}) => {
    useBackNavigation(!!open, (val) => onOpenChange?.(val))
    if (!open) return null
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => onOpenChange?.(false)}>
            {children}
        </div>
    )
}

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
            "relative z-[101] w-full max-w-lg gap-4 rounded-2xl bg-background shadow-2xl animate-in fade-in-0 zoom-in-95",
            className
        )}
        {...props}
    >
        {children}
    </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
