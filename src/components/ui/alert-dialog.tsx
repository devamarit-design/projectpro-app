"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useBackNavigation } from "@/hooks/use-back-navigation"

// Context
const AlertDialogContext = React.createContext<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
} | null>(null)

const AlertDialog = ({
    children,
    open,
    onOpenChange
}: {
    children: React.ReactNode,
    open?: boolean,
    onOpenChange?: (open: boolean) => void
}) => {
    useBackNavigation(!!open, (val) => onOpenChange?.(val))
    return (
        <AlertDialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </AlertDialogContext.Provider>
    )
}

const AlertDialogTrigger = ({ children, asChild, ...props }: any) => {
    const context = React.useContext(AlertDialogContext)
    return (
        <div onClick={() => context?.onOpenChange?.(true)} {...props}>
            {children}
        </div>
    )
}

const AlertDialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    if (!context?.open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in fade-in-0"
                onClick={() => context.onOpenChange?.(false)}
            />

            {/* Content */}
            <div
                ref={ref}
                className={cn(
                    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg",
                    className
                )}
                {...props}
            />
        </div>
    )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-2 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
    />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    return (
        <button
            ref={ref}
            className={cn(buttonVariants(), className)}
            onClick={(e) => {
                onClick?.(e)
                context?.onOpenChange?.(false)
            }}
            {...props}
        />
    )
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext)
    return (
        <button
            ref={ref}
            className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 sm:mt-0",
                className
            )}
            onClick={(e) => {
                onClick?.(e)
                context?.onOpenChange?.(false)
            }}
            {...props}
        />
    )
})
AlertDialogCancel.displayName = "AlertDialogCancel"

// Stubs
const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const AlertDialogOverlay = () => <div />

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
}
