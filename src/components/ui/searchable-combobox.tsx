"use client"

import * as React from "react"
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
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options
        const query = searchQuery.toLowerCase()
        return options.filter(
            option =>
                option.label.toLowerCase().includes(query) ||
                option.description?.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    // Find selected option
    const selectedOption = options.find(opt => opt.value === value)

    // Handle click outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchQuery("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                    "bg-muted/30 border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    isOpen && "ring-2 ring-primary/50 border-primary/50"
                )}
            >
                <span className={cn(
                    "truncate text-sm",
                    selectedOption ? "text-foreground" : "text-muted-foreground"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    )}
                    <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className={cn(
                    "absolute z-50 w-full rounded-xl border shadow-xl",
                    "bg-card/95 backdrop-blur-xl border-white/10",
                    "animate-in fade-in-0 zoom-in-95 duration-150",
                    dropdownPosition === "bottom"
                        ? "top-full mt-1 slide-in-from-top-2"
                        : "bottom-full mb-1 slide-in-from-bottom-2"
                )}>
                    {/* Search Input */}
                    <div className="px-2 pb-2">
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
                                    "bg-muted/30 border border-white/10 focus:border-primary/50",
                                    "focus:outline-none focus:ring-1 focus:ring-primary/30",
                                    "placeholder:text-muted-foreground"
                                )}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto px-1 overscroll-contain touch-pan-y">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => !option.disabled && handleSelect(option.value)}
                                    disabled={option.disabled}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                        "hover:bg-white/5",
                                        option.disabled && "opacity-50 cursor-not-allowed",
                                        value === option.value && "bg-primary/10"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            value === option.value && "text-primary"
                                        )}>
                                            {option.label}
                                        </p>
                                        {option.description && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {option.description}
                                            </p>
                                        )}
                                    </div>
                                    {value === option.value && (
                                        <Check className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
