"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { Search, Plus, Archive, ChevronDown, LayoutList, LayoutGrid, Grid3x3, CheckCircle2, PauseCircle, Hammer, FileText, Layers, FolderKanban } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"

import { useProjects } from "@/context/project-context"
import { ProjectCard } from "@/components/projects/project-card"
import { getExpensesByProject } from "@/lib/project-utils"

export default function ProjectsPage() {
    const { t } = useTranslation()
    const { projects, archivedProjects, expenses, tasks, isLoading, currentUser, archiveProject, unarchiveProject } = useProjects()
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL-based State
    const searchQuery = searchParams.get("q") || ""
    const statusFilter = searchParams.get("status") || null
    const showArchived = searchParams.get("archived") === "true"
    const [columns, setColumns] = useState<1 | 2 | 3 | 'auto'>(2)

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
        return getExpensesByProject(expenses)
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

    // Counts per status
    const statusCounts = useMemo(() => {
        const base = sourceProjects.filter(project => {
            if (!searchQuery) return true
            return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.location.toLowerCase().includes(searchQuery.toLowerCase())
        })

        return {
            All: base.length,
            "In Progress": base.filter(p => p.status === "In Progress").length,
            "Planning": base.filter(p => p.status === "Planning").length,
            "On Hold": base.filter(p => p.status === "On Hold").length,
            "Completed": base.filter(p => p.status === "Completed").length,
        }
    }, [sourceProjects, searchQuery])

    const statusTabs = [
        { id: null, value: null, label: t.projects.status.all, icon: Layers, count: statusCounts.All },
        { id: "In Progress", value: "In Progress", label: t.projects.status.in_progress, icon: Hammer, count: statusCounts["In Progress"], color: "text-blue-500" },
        { id: "Planning", value: "Planning", label: t.projects.status.planning, icon: FileText, count: statusCounts["Planning"], color: "text-purple-500" },
        { id: "On Hold", value: "On Hold", label: t.projects.status.on_hold, icon: PauseCircle, count: statusCounts["On Hold"], color: "text-amber-500" },
        { id: "Completed", value: "Completed", label: t.projects.status.completed, icon: CheckCircle2, count: statusCounts["Completed"], color: "text-emerald-500" },
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
                {/* Row 1: Status Tabs Bar */}
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex p-1 bg-muted/30 border border-white/5 rounded-2xl w-fit min-w-full sm:min-w-0">
                        <div className="flex items-center gap-1">
                            {statusTabs.map((tab) => {
                                const isActive = (statusFilter === null && tab.value === null) || statusFilter === tab.value
                                const Icon = tab.icon

                                return (
                                    <button
                                        key={tab.id || "all"}
                                        onClick={() => updateUrl("status", tab.value)}
                                        className={cn(
                                            "group flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                                            isActive
                                                ? "bg-foreground text-background shadow-md shadow-black/10 font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-colors shrink-0", isActive ? "text-background" : tab.color || "text-muted-foreground")} />
                                        <span>{tab.label}</span>
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums transition-colors",
                                                isActive
                                                    ? "bg-background/20 text-background"
                                                    : "bg-white/10 text-muted-foreground group-hover:text-foreground group-hover:bg-white/15"
                                            )}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Row 2: Search & Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t.projects.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => updateUrl("q", e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
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

                        {/* Archive Toggle Button */}
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
                            <Archive className="w-4 h-4" />
                            {showArchived && <span className="text-sm font-semibold">Archived</span>}
                        </button>

                        {/* Column Layout Buttons */}
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
                    <div className="col-span-full py-16 text-center text-muted-foreground">
                        <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-base font-medium">{t.projects.empty}</p>
                        {statusFilter && (
                            <button
                                onClick={() => updateUrl("status", null)}
                                className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                            >
                                <Layers className="w-4 h-4" />
                                <span>{t.projects.status.all} ({statusCounts.All})</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
