"use client"

import * as React from "react"
import { Search, Plus, Store, Wrench, Truck, Phone, MapPin, Star, MoreHorizontal, User, Filter, Building } from "lucide-react"
import { useProjects } from "@/context/project-context"
import { cn } from "@/lib/utils"
// Components
import AddPartnerDialog from "@/components/partners/add-partner-dialog"
import PartnerDetailSheet from "@/components/partners/partner-detail-sheet"

type FilterType = "All" | "Technician" | "Store" | "Contractor"

export default function PartnersPage() {
    const { workers, vendors } = useProjects()
    const [activeTab, setActiveTab] = React.useState<FilterType>("All")
    const [searchQuery, setSearchQuery] = React.useState("")

    // Dialog States
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [addType, setAddType] = React.useState<"Person" | "Business">("Person")

    const [selectedPartnerId, setSelectedPartnerId] = React.useState<string | null>(null)
    const [selectedPartnerType, setSelectedPartnerType] = React.useState<"Worker" | "Vendor" | null>(null)

    // Combined and Filtered Data
    const displayData = React.useMemo(() => {
        const people = workers.map(u => ({ ...u, type: "Worker", subType: u.role || "Technician" }))
        const businesses = vendors.map(v => ({ ...v, type: "Vendor", subType: v.category || "Store" }))

        const all = [...people, ...businesses]

        return all.filter(item => {
            // Tab Filter
            if (activeTab === "Technician") {
                if (item.type !== "Worker") return false
                // Optional: strictly filter roles like 'Technician', 'Worker' etc.
            } else if (activeTab === "Store") {
                if (item.type !== "Vendor") return false
            } else if (activeTab === "Contractor") {
                // Could be Worker (Contractor) or Vendor (Sub-contract)
                const isContractorUser = item.type === "Worker" && (item.subType === "Contractor" || item.subType === "Foreman")
                const isSubContractFirm = item.type === "Vendor" && item.subType === "Sub-contract"
                if (!isContractorUser && !isSubContractFirm) return false
            }

            // Search
            const nameSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
            const locationSearch = item.location?.toLowerCase().includes(searchQuery.toLowerCase())

            return nameSearch || locationSearch
        })
    }, [workers, vendors, activeTab, searchQuery])

    const handleOpenAdd = () => {
        // Default type based on tab
        if (activeTab === "Store") setAddType("Business")
        else setAddType("Person")
        setIsAddOpen(true)
    }

    const handlePartnerClick = (id: string, type: string) => {
        setSelectedPartnerId(id)
        setSelectedPartnerType(type as "Worker" | "Vendor")
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Partners</h1>
                    <p className="text-muted-foreground mt-1">Manage technicians, contractors, and material stores.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Partner
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    {(["All", "Technician", "Contractor", "Store"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                activeTab === tab
                                    ? "bg-background text-foreground shadow-sm font-bold"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        placeholder="Search partners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayData.map((partner) => (
                    <div
                        key={`${partner.type}-${partner.id}`}
                        onClick={() => handlePartnerClick(partner.id, partner.type)}
                        className="group glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                        partner.type === 'Vendor' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {partner.type === 'Vendor' ? <Store className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{partner.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                            {partner.subType}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm font-bold">{partner.rating || "-"}</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm pt-2">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Phone className="w-4 h-4 shrink-0 opacity-70" />
                                    <span className="truncate">{partner.phone || "No phone"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <MapPin className="w-4 h-4 shrink-0 opacity-70" />
                                    <span className="truncate">{partner.location || "No location"}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                                    partner.status === 'Active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {partner.status}
                                </span>
                                <button className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Components */}
            <AddPartnerDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                defaultType={addType}
            />

            <PartnerDetailSheet
                partnerId={selectedPartnerId}
                type={selectedPartnerType}
                onClose={() => setSelectedPartnerId(null)}
            />
        </div>
    )
}

