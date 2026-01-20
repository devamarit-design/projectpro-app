"use client"

import * as React from "react"
import { Search, Plus, User, Building, Phone, MapPin, Archive } from "lucide-react"
import { useProjects } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
// Components
import AddCustomerDialog from "@/components/customers/add-customer-dialog"
import CustomerDetailSheet from "@/components/customers/customer-detail-sheet"

export default function CustomersPage() {
    const { customers, projects } = useProjects()
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null)
    const [showArchived, setShowArchived] = React.useState(false)

    // Filter Logic
    const filteredCustomers = React.useMemo(() => {
        return customers.filter(c => {
            // Search filter
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.phone && c.phone.includes(searchQuery))
            if (!matchesSearch) return false

            // Archive filter - hide Inactive unless showArchived is true
            if (!showArchived && c.status === 'Inactive') return false

            return true
        })
    }, [customers, searchQuery, showArchived])

    // Helper to count projects for a customer
    const getProjectCount = (customerName: string) => {
        return projects.filter(p => p.customer.trim().toLowerCase() === customerName.trim().toLowerCase()).length
    }

    return (
        <div className="space-y-6 pb-24 font-sans max-w-7xl mx-auto pt-6">

            {/* Header & Actions */}
            <div className="flex flex-col gap-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                            {t.customers.title} <span className="text-sm font-medium px-2 py-1 bg-white/10 rounded-full text-muted-foreground">{filteredCustomers.length}</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">{t.customers.subtitle}</p>
                    </div>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t.customers.add_customer}</span>
                    </button>
                </div>

                {/* Search + Archive Toggle */}
                <div className="flex items-center gap-2">
                    <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.customers.search_placeholder}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-white/5 focus:border-primary/30 focus:bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-2 px-3 h-11 rounded-xl text-sm font-medium transition-all whitespace-nowrap border",
                            showArchived
                                ? "bg-gray-500/20 border-gray-500/50 text-gray-400"
                                : "bg-background/50 border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                        title={showArchived ? "Hide Archived" : "Show Archived"}
                    >
                        <Archive className="w-4 h-4" />
                        <span className="hidden sm:inline">Archived</span>
                    </button>
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => {
                    const projectCount = getProjectCount(customer.name)
                    return (
                        <div
                            key={customer.id}
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className="group relative glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Ambient Background Icon */}
                            <div className={cn(
                                "absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110",
                                customer.type === 'Company' ? "rotate-[-10deg]" : ""
                            )}>
                                {customer.type === 'Company' ? <Building className="w-32 h-32" /> : <User className="w-32 h-32" />}
                            </div>

                            <div className="relative z-10 flex flex-col h-full gap-4">
                                {/* Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner",
                                            customer.type === 'Company'
                                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                        )}>
                                            {customer.type === 'Company' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{customer.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{customer.type}</p>
                                        </div>
                                    </div>

                                    {projectCount > 0 && (
                                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            {projectCount} {t.customers.active}
                                        </span>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/5" />

                                {/* Info */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                        <div className="w-6 flex justify-center">
                                            <Phone className="w-3.5 h-3.5 opacity-50" />
                                        </div>
                                        <span className="truncate">{customer.phone || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                        <div className="w-6 flex justify-center">
                                            <MapPin className="w-3.5 h-3.5 opacity-50" />
                                        </div>
                                        <span className="truncate line-clamp-1">{customer.address || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                    <User className="w-12 h-12 mb-3" />
                    <p className="font-medium">{t.customers.empty}</p>
                </div>
            )}

            {/* Dialogs */}
            <AddCustomerDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
            />

            <CustomerDetailSheet
                customerId={selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
            />
        </div>
    )
}
