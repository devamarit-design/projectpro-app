"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { Search, Plus, Filter, Calendar, MapPin, MoreHorizontal, Archive, RefreshCcw, ChevronDown, LayoutList, LayoutGrid, Grid3x3 } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { hasPermission } from "@/lib/permissions"
import { cn } from "@/lib/utils"

import { useProjects } from "@/context/project-context"

export default function ProjectsPage() {
    const { t } = useTranslation()
    const { projects, archivedProjects, expenses, isLoading, currentUser, archiveProject, unarchiveProject } = useProjects()
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL-based State
    const searchQuery = searchParams.get("q") || ""
    const statusFilter = searchParams.get("status") || null
    const showArchived = searchParams.get("archived") === "true"
    const [showFilters, setShowFilters] = useState(false) // UI toggle can remain local
    const [columns, setColumns] = useState<1 | 2 | 3 | 'auto'>(1)


    const [archiveConfirm, setArchiveConfirm] = useState<{ isOpen: boolean; projectId: string | null }>({
        isOpen: false,
        projectId: null
    })

    // Update URL helper
    const updateUrl = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Calculate total expenses per project from actual expense data
    const getProjectExpenses = useMemo(() => {
        const expensesByProject: Record<string, number> = {}
        expenses.forEach(expense => {
            if (expense.projectId) {
                expensesByProject[expense.projectId] = (expensesByProject[expense.projectId] || 0) + (expense.totalValue || 0)
            }
            // Also check item-level projectIds
            expense.items?.forEach(item => {
                if (item.projectId) {
                    expensesByProject[item.projectId] = (expensesByProject[item.projectId] || 0) + (item.amount || 0)
                }
            })
        })
        return expensesByProject
    }, [expenses])

    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'start_date' | 'end_date'>('recent')

    // Filter logic
    const sourceProjects = showArchived ? archivedProjects : projects
    const filteredProjects = sourceProjects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter ? project.status === statusFilter : true

        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        // Always prioritize "In Progress" projects first
        const aInProgress = a.status === "In Progress" ? 0 : 1
        const bInProgress = b.status === "In Progress" ? 0 : 1
        if (aInProgress !== bInProgress) return aInProgress - bInProgress

        // Then apply the selected sort
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name)
            case 'start_date':
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            case 'end_date':
                return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
            case 'recent':
            default:
                const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
                const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
                return timeB - timeA
        }
    })

    const statuses = [
        { label: t.projects.status.in_progress, value: "In Progress" },
        { label: t.projects.status.completed, value: "Completed" },
        { label: t.projects.status.on_hold, value: "On Hold" }
    ]

    const handleArchiveConfirm = async () => {
        if (archiveConfirm.projectId) {
            await archiveProject(archiveConfirm.projectId)
            setArchiveConfirm({ isOpen: false, projectId: null })
        }
    }

    const handleRestore = async (id: string) => {
        await unarchiveProject(id)
    }

    return (
        <div className="space-y-6 pb-20">
            <ConfirmDialog
                isOpen={archiveConfirm.isOpen}
                onClose={() => setArchiveConfirm({ isOpen: false, projectId: null })}
                onConfirm={handleArchiveConfirm}
                title="Archive โปรเจค"
                message="คุณต้องการ Archive โปรเจคนี้หรือไม่?"
                confirmText="Archive"
                cancelText="ยกเลิก"
                variant="warning"
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">{t.common.projects}</h1>
                    <p className="text-muted-foreground mt-1">{t.projects.manage_projects}</p>
                </div>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t.projects.create_project}</span>
                </Link>
            </div>

            {/* Filter & Search */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t.projects.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => updateUrl("q", e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Left: Sort, Filter, Archive */}
                        <div className="flex items-center gap-2">
                            {/* Sort Dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="pl-3 pr-8 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="recent">Recently Active</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="start_date">Start Date</option>
                                    <option value="end_date">End Date</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-3 py-2 border rounded-xl transition-all duration-300 shrink-0 ${showFilters || statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 border-white/10 hover:bg-muted/50 text-muted-foreground'}`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => updateUrl("archived", showArchived ? null : "true")}
                                className={cn(
                                    "px-3 py-2 border rounded-xl transition-all duration-300 flex items-center gap-2 shrink-0",
                                    showArchived
                                        ? "bg-gray-500/20 text-gray-500 border-gray-500/50"
                                        : "bg-background/50 border-white/10 hover:bg-muted/50 text-muted-foreground"
                                )}
                                title={showArchived ? "Show Active Projects" : "Show Archived Projects"}
                            >
                                <Archive className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Right: Column Layout Buttons */}
                        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1">
                            <button
                                onClick={() => setColumns(1)}
                                className={`p-2 rounded-lg transition-all ${columns === 1 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/10'}`}
                                title="1 Column"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setColumns(2)}
                                className={`p-2 rounded-lg transition-all ${columns === 2 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/10'}`}
                                title="2 Columns"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setColumns(3)}
                                className={`p-2 rounded-lg transition-all ${columns === 3 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/10'}`}
                                title="3 Columns"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Chips - Expandable */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showFilters ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="flex flex-wrap gap-2 pt-1">
                            {/* ... chips ... */}
                            <button
                                onClick={() => updateUrl("status", null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === null
                                    ? 'bg-primary/20 text-primary border-primary/20'
                                    : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50'}`}
                            >
                                {t.projects.status.all}
                            </button>
                            {statuses.map(status => (
                                <button
                                    key={status.value}
                                    onClick={() => updateUrl("status", status.value === statusFilter ? null : status.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === status.value
                                        ? 'bg-primary/20 text-primary border-primary/20'
                                        : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50'}`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className={cn(
                "grid gap-6 transition-all duration-300 ease-in-out",
                columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-2",
                columns === 3 && "grid-cols-3"
            )}>
                {isLoading ? (
                    // Skeleton Loading State
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-muted/10 animate-pulse">
                            <div className="h-40 bg-muted/20 w-full" />
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between">
                                    <div className="h-4 bg-muted/20 rounded w-1/3" />
                                    <div className="h-4 bg-muted/20 rounded w-1/4" />
                                </div>
                                <div className="h-4 bg-muted/20 rounded w-1/2" />
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between">
                                        <div className="h-3 bg-muted/20 rounded w-1/4" />
                                        <div className="h-3 bg-muted/20 rounded w-10" />
                                    </div>
                                    <div className="h-2 bg-muted/20 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project, idx) => (
                        <Link
                            href={`/projects/detail?id=${project.id}`}
                            key={project.id}
                            className={cn(
                                "group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/5 block",
                                project.isArchived && "opacity-60 grayscale bg-gray-500/5 hover:bg-gray-500/10 border-gray-500/20"
                            )}>
                            {/* Project Image */}
                            <div className={cn(
                                "w-full relative overflow-hidden",
                                columns === 1 ? "h-40" : "h-24"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <img
                                    src={project.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80"}
                                    alt={project.name}
                                    loading={idx < 6 ? "eager" : "lazy"}
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 z-20">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full font-medium border",
                                        columns === 1 ? "text-xs px-3 py-1" : "text-[10px]",
                                        project.status === 'Completed' ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                                            project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' :
                                                'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                                    )}>
                                        {project.status === 'In Progress' ? t.projects.status.in_progress :
                                            project.status === 'Completed' ? t.projects.status.completed :
                                                t.projects.status.on_hold}
                                    </span>
                                </div>
                                <div className={cn(
                                    "absolute bottom-2 left-2 z-20 text-white",
                                    columns === 1 ? "bottom-4 left-4" : ""
                                )}>
                                    <h3 className={cn(
                                        "font-bold",
                                        columns === 1 ? "text-lg" : "text-sm line-clamp-1"
                                    )}>{project.name}</h3>
                                    {columns === 1 && (
                                        <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {project.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Content - Compact for multiple columns */}
                            <div className={cn(
                                "space-y-2",
                                columns === 1 ? "p-4 space-y-4" : "p-2"
                            )}>
                                {columns === 1 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t.projects.customer}</span>
                                        <span className="font-medium">{project.customer}</span>
                                    </div>
                                )}
                                {hasPermission(currentUser, "FINANCIAL_VIEW") && (
                                    <>
                                        <div className={cn(
                                            "flex justify-between items-center",
                                            columns === 1 ? "text-sm" : "text-xs"
                                        )}>
                                            <span className="text-muted-foreground">{t.projects.budget}</span>
                                            <span className="font-medium">{project.budget}</span>
                                        </div>

                                        {/* Progress Bar - Only show in single column or show compact version */}
                                        <div className="space-y-1">
                                            {(() => {
                                                const projectExpenses = getProjectExpenses[project.id] || 0
                                                const budgetValue = parseInt(String(project.budget || "0").replace(/[^0-9]/g, '')) || 1
                                                const costPercent = Math.min(Math.round((projectExpenses / budgetValue) * 100), 100)
                                                return (
                                                    <>
                                                        {columns === 1 && (
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">{t.projects.cost_value}</span>
                                                                <span className="font-medium text-primary">
                                                                    {costPercent}%
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "w-full bg-muted rounded-full overflow-hidden",
                                                            columns === 1 ? "h-2" : "h-1"
                                                        )}>
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${costPercent}%` }}
                                                            />
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </>
                                )}

                                {/* Footer - Only show in single column view */}
                                {columns === 1 && (
                                    <div className="pt-2 flex justify-between items-center border-t border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>{t.projects.due}: {project.endDate}</span>
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (showArchived) {
                                                    await handleRestore(project.id)
                                                } else {
                                                    setArchiveConfirm({ isOpen: true, projectId: project.id })
                                                }
                                            }}
                                            className={cn(
                                                "p-2 rounded-full transition-colors group/archive",
                                                project.status === 'Completed' || showArchived
                                                    ? "hover:bg-amber-500/10"
                                                    : "opacity-30 cursor-not-allowed"
                                            )}
                                            title={showArchived ? "Restore Project" : (project.status === 'Completed' ? "Archive" : "Only Completed projects can be archived")}
                                            disabled={!showArchived && project.status !== 'Completed'}
                                        >
                                            {showArchived ? (
                                                <RefreshCcw className="w-4 h-4 text-green-500 group-hover/archive:text-green-600" />
                                            ) : (
                                                <Archive className={cn(
                                                    "w-4 h-4",
                                                    project.status === 'Completed'
                                                        ? "text-muted-foreground group-hover/archive:text-amber-500"
                                                        : "text-muted-foreground"
                                                )} />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>{t.projects.empty}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
