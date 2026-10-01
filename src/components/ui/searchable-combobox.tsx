"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Search, ChevronDown, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
    value: string
    label: string
    description?: string
    disabled?: boolean
}

interface SearchableComboboxProps {
    options: ComboboxOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
    dropdownPosition?: "top" | "bottom"
}

export default function SearchableCombobox({
    options,
    value,
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found",
    className,
    disabled = false,
    dropdownPosition = "bottom",
}: SearchableComboboxProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [mounted, setMounted] = React.useState(false)
    const [coords, setCoords] = React.useState<{
        top?: number
        bottom?: number
        left: number
        width: number
        openUpward: boolean
    } | null>(null)

    const containerRef = React.useRef<HTMLDivElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Filter options based on search query and remove empty/invalid options
    const filteredOptions = React.useMemo(() => {
        const validOptions = options.filter(opt => opt && typeof opt.label === 'string' && opt.label.trim().length > 0)
        if (!searchQuery) return validOptions
        const query = searchQuery.toLowerCase().trim()
        return validOptions.filter(
            option =>
                option.label.toLowerCase().includes(query) ||
                option.description?.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    // Find selected option
    const selectedOption = options.find(opt => opt.value === value)

    // Calculate fixed screen coordinates for the frontmost portal
    const updatePosition = React.useCallback(() => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()

        // If trigger moved off viewport entirely, close dropdown
        if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
            setIsOpen(false)
            return
        }

        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const openUpward = dropdownPosition === "top" ||
            (dropdownPosition !== "bottom" && spaceBelow < 250 && spaceAbove > spaceBelow) ||
            (dropdownPosition === "bottom" && spaceBelow < 210 && spaceAbove > 240)

        const padding = 8
        const width = Math.min(rect.width, window.innerWidth - padding * 2)
        const left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding))

        setCoords({
            top: rect.bottom + 6,
            bottom: window.innerHeight - rect.top + 6,
            left,
            width,
            openUpward,
        })
    }, [dropdownPosition])

    // Update position on open, scroll, or resize
    React.useEffect(() => {
        if (!isOpen) return

        updatePosition()

        const handleScrollOrResize = () => {
            updatePosition()
        }

        window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true })
        window.addEventListener("resize", handleScrollOrResize, { passive: true })

        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, { capture: true })
            window.removeEventListener("resize", handleScrollOrResize)
        }
    }, [isOpen, updatePosition])

    // Handle click outside to close
    React.useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false)
                setSearchQuery("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    // Focus input when opened
    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
        setSearchQuery("")
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange("")
        setSearchQuery("")
    }

    return (
        <div ref={containerRef} className={cn("relative min-w-0 w-full", className)}>
            {/* Trigger Button */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                    if (!disabled) {
                        updatePosition()
                        setIsOpen(!isOpen)
                    }
                }}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        updatePosition()
                        setIsOpen(!isOpen)
                    }
                }}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    "bg-background hover:bg-muted/30 border-border hover:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    isOpen && "ring-2 ring-primary/50 border-primary"
                )}
            >
                <span className={cn(
                    "truncate text-sm",
                    selectedOption ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </div>

            {/* Dropdown Menu Portaled to document.body (Frontmost layer z-[99999]) */}
            {isOpen && mounted && coords && typeof document !== "undefined" && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: "fixed",
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        ...(coords.openUpward
                            ? { bottom: `${coords.bottom}px` }
                            : { top: `${coords.top}px` }),
                        zIndex: 99999,
                    }}
                    className={cn(
                        "rounded-xl border shadow-2xl overflow-hidden pointer-events-auto",
                        "bg-popover text-popover-foreground border-border",
                        "animate-in fade-in-0 zoom-in-95 duration-150",
                        coords.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
                    )}
                >
                    {/* Search Input */}
                    <div className="p-2 pb-1.5 bg-popover border-b border-border/80">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className={cn(
                                    "w-full pl-8 pr-3 py-2 rounded-lg text-sm",
                                    "bg-muted/50 border border-border text-foreground focus:border-primary/50",
                                    "focus:outline-none focus:ring-1 focus:ring-primary/30",
                                    "placeholder:text-muted-foreground"
                                )}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 overscroll-contain touch-pan-y bg-popover custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isActionItem = option.value === "NEW" || option.label.startsWith("➕") || option.label.startsWith("+")
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => !option.disabled && handleSelect(option.value)}
                                        disabled={option.disabled}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer",
                                            isActionItem
                                                ? "bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 my-1"
                                                : "hover:bg-muted text-foreground",
                                            option.disabled && "opacity-50 cursor-not-allowed",
                                            value === option.value && !isActionItem && "bg-primary/15 text-primary font-semibold"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                (value === option.value || isActionItem) && "text-primary font-semibold"
                                            )}>
                                                {option.label}
                                            </p>
                                            {option.description && (
                                                <p className={cn(
                                                    "text-xs truncate mt-0.5",
                                                    isActionItem ? "text-primary/70" : "text-muted-foreground"
                                                )}>
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                        {value === option.value && !isActionItem && (
                                            <Check className="w-4 h-4 text-primary shrink-0" />
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

