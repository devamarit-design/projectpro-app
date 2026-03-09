"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Sheet = ({
    open,
    onOpenChange,
    children
}: {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => onOpenChange?.(false)}>
            {children}
        </div>
    )
}

const SheetContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
            "h-full w-full max-w-sm bg-background shadow-xl animate-in slide-in-from-right duration-300",
            className
        )}
        {...props}
    >
        {children}
    </div>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
        {...props}
    />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold text-foreground", className)}
        {...props}
    />
))
SheetTitle.displayName = "SheetTitle"

export { Sheet, SheetContent, SheetHeader, SheetTitle }
