"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

interface SelectProps {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
}

const Select = ({ value = "", onValueChange = () => { }, children }: SelectProps) => {
    const [open, setOpen] = React.useState(false)

    // Close on click outside
    React.useEffect(() => {
        if (!open) return
        const handleClick = () => setOpen(false)
        window.addEventListener("click", handleClick)
        return () => window.removeEventListener("click", handleClick)
    }, [open])

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative w-full">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const context = React.useContext(SelectContext)
    return <span>{context?.value || placeholder}</span>
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext)

        return (
            <button
                ref={ref}
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    context?.setOpen(!context?.open)
                }}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", context?.open && "rotate-180")} />
            </button>
        )
    }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        if (!context?.open) return null

        return (
            <div
                ref={ref}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "absolute z-[100] mt-1 max-h-60 w-full overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                    className
                )}
                {...props}
            >
                <div className="overflow-auto max-h-56">
                    {children}
                </div>
            </div>
        )
    }
)
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
    ({ className, value, children, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        const isSelected = context?.value === value

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-8 text-sm outline-none hover:bg-white/10 transition-colors",
                    isSelected && "bg-white/5 font-bold text-primary",
                    className
                )}
                onClick={() => {
                    context?.onValueChange(value)
                    context?.setOpen(false)
                }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
SelectItem.displayName = "SelectItem"

export {
    Select,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem,
}
