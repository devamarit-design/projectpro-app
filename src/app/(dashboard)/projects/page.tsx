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
import { ProjectCard } from "@/components/projects/project-card"

export default function ProjectsPage() {
    const { t } = useTranslation()
    const { projects, archivedProjects, expenses, tasks, isLoading, currentUser, archiveProject, unarchiveProject } = useProjects()
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

    // Calculate task count per project
    const getProjectTaskCount = useMemo(() => {
        const tasksByProject: Record<string, number> = {}
        tasks.forEach(task => {
            if (task.projectId) {
                tasksByProject[task.projectId] = (tasksByProject[task.projectId] || 0) + 1
            }
        })
        return tasksByProject
    }, [tasks])

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
                    filteredProjects.map((project, idx) => {
                        const budgetValue = parseInt(String(project.budget || "0").replace(/[^0-9]/g, '')) || 0
                        const projectExpenses = getProjectExpenses[project.id] || 0
                        const taskCount = getProjectTaskCount[project.id] || 0

                        return (
                            <div key={project.id} className={cn(
                                "h-full",
                                columns === 1 && "h-80",
                                columns === 2 && "h-72",
                                columns === 3 && "h-48"
                            )}>
                                <ProjectCard
                                    project={{
                                        id: project.id,
                                        name: project.name,
                                        client: project.customer,
                                        taskCount: taskCount,
                                        budget: budgetValue,
                                        expenses: projectExpenses,
                                        imageUrl: project.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
                                        status: project.status === 'In Progress' ? 'active' : project.status === 'Completed' ? 'completed' : 'pending'
                                    }}
                                    columns={columns as 1 | 2 | 3}
                                    priority={idx < 6}
                                />
                            </div>
                        )
                    })
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
