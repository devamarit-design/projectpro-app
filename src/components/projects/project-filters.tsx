"use client"

import * as React from "react"
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react"

const months = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const types = ["All", "Interior", "Construction", "Renovation", "Design"]

export function ProjectFilters() {
    const [activeTab, setActiveTab] = React.useState("Type") // Type or Month
    const [activeFilter, setActiveFilter] = React.useState("All")

    const filters = activeTab === "Type" ? types : months

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        placeholder="Search projects by name, client..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors text-sm font-medium">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors text-sm font-medium">
                        <ArrowUpDown className="w-4 h-4" />
                        Sort
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex p-1 bg-muted rounded-full shrink-0">
                    <button
                        onClick={() => { setActiveTab("Type"); setActiveFilter("All") }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === "Type" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Type
                    </button>
                    <button
                        onClick={() => { setActiveTab("Month"); setActiveFilter("All") }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === "Month" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Month
                    </button>
                </div>
                <div className="h-6 w-px bg-border shrink-0" />
                <div className="flex gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${activeFilter === filter
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
