"use client"

import * as React from "react"
import {
    Package,
    Plus,
    Search,
    Filter,
    Store,
    Phone,
    MapPin,
    ExternalLink,
    Tag,
    Grid,
    List,
    Image as ImageIcon,
    FolderKanban,
    MoreVertical,
    Edit3,
    Trash2,
    ArrowUpDown,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Sparkles,
    Building2,
    Layers,
    Boxes,
    Check
} from "lucide-react"
import { CatalogItem, CATALOG_CATEGORIES, CatalogCategory } from "@/types/catalog"
import { subscribeCatalogItems, deleteCatalogItem } from "@/lib/services/catalog-service"
import { AddCatalogItemDialog } from "@/components/catalog/add-catalog-item-dialog"
import { CatalogItemDetailModal } from "@/components/catalog/catalog-item-detail-modal"
import { useOrganization } from "@/context/organization-context"
import { useProjects } from "@/context/project-context"
import Image from "next/image"

type SortOption = "latest" | "price_asc" | "price_desc" | "name_asc"

export default function CatalogPage() {
    const { currentOrg } = useOrganization()
    const { currentTeam, projects, vendors } = useProjects()

    const orgId = currentOrg?.id || currentTeam?.id || "default_org"

    const [items, setItems] = React.useState<CatalogItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Filters and View states
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
    const [selectedProjectFilter, setSelectedProjectFilter] = React.useState<string>("all")
    const [sortBy, setSortBy] = React.useState<SortOption>("latest")
    const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")

    // Dialog & Modal states
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null)
    const [detailItem, setDetailItem] = React.useState<CatalogItem | null>(null)

    // Real-time subscription to items
    React.useEffect(() => {
        setIsLoading(true)
        const unsubscribe = subscribeCatalogItems(
            orgId,
            (fetchedItems) => {
                setItems(fetchedItems)
                setIsLoading(false)
            },
            (error) => {
                console.error("Catalog subscription error:", error)
                setIsLoading(false)
            }
        )

        return () => {
            if (typeof unsubscribe === "function") unsubscribe()
        }
    }, [orgId])

    // Filter and Sort items
    const filteredItems = React.useMemo(() => {
        let result = [...items]

        // Category filter
        if (selectedCategory !== "all") {
            result = result.filter(item => item.category === selectedCategory)
        }

        // Project filter
        if (selectedProjectFilter !== "all") {
            result = result.filter(item => {
                const hasInProjectIds = item.projectIds && item.projectIds.includes(selectedProjectFilter)
                const hasInLegacy = item.projectId === selectedProjectFilter
                return hasInProjectIds || hasInLegacy
            })
        }

        // Search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(item => {
                const nameMatch = (item.name || "").toLowerCase().includes(query)
                const codeMatch = (item.code || "").toLowerCase().includes(query)
                const storeMatch = (item.storeName || "").toLowerCase().includes(query)
                const categoryMatch = (item.category || "").toLowerCase().includes(query)
                const descMatch = (item.description || "").toLowerCase().includes(query)
                const projectMatch = (item.projectName || "").toLowerCase().includes(query) ||
                    (item.projectNames && item.projectNames.some(pn => pn.toLowerCase().includes(query)))
                return nameMatch || codeMatch || storeMatch || categoryMatch || descMatch || projectMatch
            })
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "price_asc") {
                return (Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0)
            }
            if (sortBy === "price_desc") {
                return (Number(b.unitPrice) || 0) - (Number(a.unitPrice) || 0)
            }
            if (sortBy === "name_asc") {
                return (a.name || "").localeCompare(b.name || "", "th")
            }
            // default latest
            const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
            const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
            return bTime - aTime
        })

        return result
    }, [items, selectedCategory, selectedProjectFilter, searchQuery, sortBy])

    // Stats calculations for Cover Banner
    const stats = React.useMemo(() => {
        const uniqueCategories = new Set(items.map(i => i.category || "อื่นๆ")).size
        const uniqueStores = new Set(items.filter(i => i.storeName).map(i => i.storeName!.trim().toLowerCase())).size
        const pIds = new Set<string>()
        items.forEach(item => {
            if (item.projectIds) item.projectIds.forEach(id => pIds.add(id))
            if (item.projectId) pIds.add(item.projectId)
        })

        return {
            totalItems: items.length,
            categoriesCount: uniqueCategories,
            storesCount: uniqueStores,
            linkedProjectsCount: pIds.size
        }
    }, [items])

    // Category counts for quick badges
    const categoryCounts = React.useMemo(() => {
        const counts: Record<string, number> = { all: items.length }
        for (const item of items) {
            const cat = item.category || "อื่นๆ"
            counts[cat] = (counts[cat] || 0) + 1
        }
        return counts
    }, [items])

    const handleEdit = (item: CatalogItem) => {
        setDetailItem(null)
        setEditingItem(item)
        setIsAddDialogOpen(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณต้องการลบ "${name}" หรือไม่?`)) return
        try {
            await deleteCatalogItem(id)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (error) {
            console.error("Failed to delete catalog item:", error)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-12">
            {/* HERO COVER BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-white/10 p-6 sm:p-8 shadow-2xl text-white">
                {/* Ambient glow decoration */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    {/* Top Row: Title & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-amber-300">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Material & Product Catalog</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                                คลังวัสดุ & สินค้าหน้างาน
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                                บันทึกสเปค ราคาต่อหน่วย ร้านค้าคู่ค้า และแท็กโครงการที่เลือกใช้งาน เพื่อให้ทีมงาน สตาฟ และช่างหน้างานหยิบไปสั่งซื้อหรือใช้อ้างอิงได้สะดวก
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem(null)
                                    setIsAddDialogOpen(true)
                                }}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                <span>เพิ่มสินค้า / วัสดุใหม่</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black">{stats.totalItems}</div>
                                    <div className="text-[11px] text-gray-300 font-medium">รายการวัสดุทั้งหมด</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black">{stats.categoriesCount}</div>
                                    <div className="text-[11px] text-gray-300 font-medium">หมวดหมู่วัสดุ</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black">{stats.storesCount}</div>
                                    <div className="text-[11px] text-gray-300 font-medium">ร้านค้าคู่ค้า</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                                    <FolderKanban className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black">{stats.linkedProjectsCount}</div>
                                    <div className="text-[11px] text-gray-300 font-medium">โครงการที่เชื่อมโยง</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อสินค้า, รหัส SKU, ร้านค้า, หมวดหมู่, สเปค หรือชื่อโครงการ..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1"
                        >
                            ล้าง
                        </button>
                    )}
                </div>

                {/* Project Tag Filter & Sort Controls */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Project Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="all">📁 ทุกโครงการ</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    🏷️ {p.name}
                                </option>
                            ))}
                        </select>
                        <FolderKanban className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Sort option dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="latest">เรียง: อัปเดตล่าสุด</option>
                            <option value="price_asc">ราคา: ต่ำไปสูง</option>
                            <option value="price_desc">ราคา: สูงไปต่ำ</option>
                            <option value="name_asc">ชื่อ: ก - ฮ</option>
                        </select>
                        <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center border border-input rounded-xl p-0.5 bg-background shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-colors ${
                                viewMode === "grid"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Grid View"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-lg transition-colors ${
                                viewMode === "table"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === "all"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                >
                    <span>ทั้งหมด</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                        {categoryCounts["all"] || 0}
                    </span>
                </button>

                {CATALOG_CATEGORIES.map(cat => {
                    const count = categoryCounts[cat.id] || 0
                    const isSelected = selectedCategory === cat.id
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                            }`}
                        >
                            <span>{cat.label}</span>
                            {count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Items Content List / Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-72 rounded-2xl bg-muted/40 border border-border animate-pulse" />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/50 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                        <Package className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h3 className="text-base font-bold text-foreground">
                            {searchQuery || selectedCategory !== "all" || selectedProjectFilter !== "all"
                                ? "ไม่พบสินค้าหรือวัสดุที่ค้นหา"
                                : "ยังไม่มีข้อมูลใน Catalog"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {searchQuery || selectedCategory !== "all" || selectedProjectFilter !== "all"
                                ? "ลองปรับคำค้นหา หรือเลือกหมวดหมู่และโครงการอื่นดูใหม่"
                                : "คุณสามารถเพิ่มสินค้า วัสดุหน้างาน สเปค ราคา แท็กโครงการ และเบอร์โทรติดต่อร้านค้า เพื่อใช้อ้างอิงร่วมกัน"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingItem(null)
                            setIsAddDialogOpen(true)
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่มสินค้า / วัสดุรายการแรก</span>
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const hasPhotos = item.photos && item.photos.length > 0
                        const coverPhoto = hasPhotos ? item.photos[0] : null
                        const photosCount = item.photos ? item.photos.length : 0
                        const taggedProjects = item.projectNames && item.projectNames.length > 0
                            ? item.projectNames
                            : (item.projectName ? [item.projectName] : [])
                        const isStorePartner = Boolean(
                            item.storeId ||
                            (item.storeName && (vendors || []).some(v => v.name?.trim().toLowerCase() === item.storeName?.trim().toLowerCase()))
                        )

                        return (
                            <div
                                key={item.id}
                                className="group flex flex-col bg-card rounded-2xl border border-border hover:border-primary/40 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Card Photo Header */}
                                <div
                                    onClick={() => setDetailItem(item)}
                                    className="relative aspect-[4/3] w-full bg-muted/40 cursor-pointer overflow-hidden"
                                >
                                    {coverPhoto ? (
                                        <Image
                                            src={coverPhoto}
                                            alt={item.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/20">
                                            <Package className="w-12 h-12 mb-1" />
                                            <span className="text-[11px]">ไม่มีรูปภาพ</span>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm shadow">
                                            {item.category || "ทั่วไป"}
                                        </span>
                                    </div>

                                    {/* Photos counter badge */}
                                    {photosCount > 1 && (
                                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/70 text-white backdrop-blur-sm flex items-center gap-1 shadow">
                                            <ImageIcon className="w-3 h-3" />
                                            <span>{photosCount} รูป</span>
                                        </div>
                                    )}

                                    {/* SKU / Code badge */}
                                    {item.code && (
                                        <div className="absolute top-2.5 right-2.5">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/90 text-gray-800 dark:bg-black/80 dark:text-gray-200 backdrop-blur-sm shadow font-semibold">
                                                {item.code}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div className="space-y-1.5">
                                        {/* Product Name */}
                                        <h3
                                            onClick={() => setDetailItem(item)}
                                            className="font-bold text-sm text-foreground line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </h3>

                                        {/* Multi-Project Tag Badges */}
                                        {taggedProjects.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {taggedProjects.slice(0, 2).map((pName, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 max-w-[150px] truncate"
                                                        title={pName}
                                                    >
                                                        <FolderKanban className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate">{pName}</span>
                                                    </span>
                                                ))}
                                                {taggedProjects.length > 2 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                                        +{taggedProjects.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Store Name & Phone */}
                                        <div className="pt-1 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                                            {item.storeName && (
                                                <div className="flex items-center justify-between gap-1.5 truncate">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Store className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate font-medium text-foreground">
                                                            {item.storeName}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                                                        isStorePartner
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                        {isStorePartner ? "ในสโตร์" : "นอกสโตร์"}
                                                    </span>
                                                </div>
                                            )}

                                            {item.storePhone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                    <a
                                                        href={`tel:${item.storePhone.replace(/[^0-9]/g, "")}`}
                                                        className="font-semibold text-green-600 dark:text-green-400 hover:underline"
                                                    >
                                                        {item.storePhone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price and Actions Bottom */}
                                    <div className="pt-2 border-t border-border flex items-center justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-base font-extrabold text-primary">
                                                ฿{Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                / {item.unit || "ชิ้น"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDetailItem(item)}
                                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                title="ดูรายละเอียด"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* Compact Table View */
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="py-3 px-4">รูปภาพ</th>
                                    <th className="py-3 px-4">ชื่อสินค้า / รหัส</th>
                                    <th className="py-3 px-4">หมวดหมู่</th>
                                    <th className="py-3 px-4">ราคาต่อหน่วย</th>
                                    <th className="py-3 px-4">ร้านค้า / ติดต่อ</th>
                                    <th className="py-3 px-4">โครงการที่แท็ก</th>
                                    <th className="py-3 px-4 text-right">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredItems.map(item => {
                                    const coverPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null
                                    const taggedProjects = item.projectNames && item.projectNames.length > 0
                                        ? item.projectNames
                                        : (item.projectName ? [item.projectName] : [])
                                    const isStorePartner = Boolean(
                                        item.storeId ||
                                        (item.storeName && (vendors || []).some(v => v.name?.trim().toLowerCase() === item.storeName?.trim().toLowerCase()))
                                    )

                                    return (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Photo */}
                                            <td className="py-3 px-4">
                                                <div
                                                    onClick={() => setDetailItem(item)}
                                                    className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border cursor-pointer flex-shrink-0"
                                                >
                                                    {coverPhoto ? (
                                                        <Image
                                                            src={coverPhoto}
                                                            alt={item.name}
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Name & Code */}
                                            <td className="py-3 px-4">
                                                <div
                                                    onClick={() => setDetailItem(item)}
                                                    className="font-bold text-foreground hover:text-primary cursor-pointer line-clamp-1"
                                                >
                                                    {item.name}
                                                </div>
                                                {item.code && (
                                                    <span className="text-[11px] font-mono text-muted-foreground">
                                                        {item.code}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground font-medium whitespace-nowrap">
                                                    {item.category || "ทั่วไป"}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="py-3 px-4 font-semibold text-primary whitespace-nowrap">
                                                ฿{Number(item.unitPrice || 0).toLocaleString()}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                                    / {item.unit || "ชิ้น"}
                                                </span>
                                            </td>

                                            {/* Store */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 line-clamp-1">
                                                    <span className="font-medium text-foreground">
                                                        {item.storeName || "-"}
                                                    </span>
                                                    {item.storeName && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                                                            isStorePartner
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        }`}>
                                                            {isStorePartner ? "ในสโตร์" : "นอกสโตร์"}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.storePhone && (
                                                    <a
                                                        href={`tel:${item.storePhone.replace(/[^0-9]/g, "")}`}
                                                        className="text-xs text-green-600 dark:text-green-400 font-semibold hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        {item.storePhone}
                                                    </a>
                                                )}
                                            </td>

                                            {/* Projects */}
                                            <td className="py-3 px-4 text-xs text-muted-foreground">
                                                {taggedProjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {taggedProjects.map((pName, idx) => (
                                                            <span key={idx} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-[11px]">
                                                                🏷️ {pName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span>ทั่วไป</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailItem(item)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id, item.name)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit Dialog */}
            <AddCatalogItemDialog
                isOpen={isAddDialogOpen}
                onClose={() => {
                    setIsAddDialogOpen(false)
                    setEditingItem(null)
                }}
                initialData={editingItem}
                onSuccess={(saved) => {
                    setItems(prev => {
                        const idx = prev.findIndex(i => i.id === saved.id)
                        if (idx >= 0) {
                            const updated = [...prev]
                            updated[idx] = saved
                            return updated
                        }
                        return [saved, ...prev]
                    })
                }}
            />

            {/* Detail View Modal */}
            <CatalogItemDetailModal
                item={detailItem}
                isOpen={!!detailItem}
                onClose={() => setDetailItem(null)}
                onEdit={(item) => handleEdit(item)}
                onDeleted={(id) => {
                    setItems(prev => prev.filter(i => i.id !== id))
                    setDetailItem(null)
                }}
            />
        </div>
    )
}
