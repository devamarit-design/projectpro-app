"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Context to share state
const DropdownMenuContext = React.createContext<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null)

const DropdownMenu = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const [open, setOpen] = React.useState(false)
    // Close on click outside could be added here, but for MVP we skip

    // Simple click outside handler
    const ref = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div ref={ref} className={className || "relative inline-block text-left"}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, onClick, asChild, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

    return (
        asChild && React.isValidElement(children) ? (
            React.cloneElement(children as React.ReactElement, {
                // @ts-ignore
                ref,
                onClick: (e: React.MouseEvent) => {
                    context.setOpen(!context.open)
                    // @ts-ignore
                    children.props.onClick?.(e)
                    onClick?.(e as any)
                },
                ...props
            })
        ) : (
            <button
                ref={ref}
                onClick={(e) => {
                    context.setOpen(!context.open)
                    onClick?.(e)
                }}
                className={className}
                {...props}
            >
                {children}
            </button>
        )
    )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }
>(({ className, align = "center", ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context || !context.open) return null

    const alignStyles = {
        start: "left-0",
        end: "right-0",
        center: "left-1/2 -translate-x-1/2"
    }

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                "mt-2",
                alignStyles[align],
                className
            )}
            {...props}
        />
    )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, onClick, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                inset && "pl-8",
                className
            )}
            onClick={(e) => {
                onClick?.(e)
                context?.setOpen(false)
            }}
            {...props}
        />
    )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

// Stub components for compatibility
const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuCheckboxItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuRadioItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DropdownMenuShortcut = ({ children }: { children: React.ReactNode }) => <span>{children}</span>

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
}
