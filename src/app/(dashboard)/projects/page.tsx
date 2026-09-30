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

import type { LucideIcon } from "lucide-react"

interface StatusConfig {
    key: string
    labelKey: "in_progress" | "planning" | "on_hold" | "completed"
    fallbackLabel: string
    icon: LucideIcon
    color: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    lineGradient: string
}

const STATUS_SECTIONS: StatusConfig[] = [
    {
        key: "In Progress",
        labelKey: "in_progress",
        fallbackLabel: "กำลังดำเนินการ",
        icon: Hammer,
        color: "text-blue-500",
        badgeBg: "bg-blue-500/10",
        badgeText: "text-blue-500 dark:text-blue-400",
        badgeBorder: "border-blue-500/25",
        lineGradient: "from-blue-500/70 via-blue-500/25 to-transparent",
    },
    {
        key: "Planning",
        labelKey: "planning",
        fallbackLabel: "อยู่ระหว่างการวางแผน",
        icon: FileText,
        color: "text-purple-500",
        badgeBg: "bg-purple-500/10",
        badgeText: "text-purple-500 dark:text-purple-400",
        badgeBorder: "border-purple-500/25",
        lineGradient: "from-purple-500/70 via-purple-500/25 to-transparent",
    },
    {
        key: "On Hold",
        labelKey: "on_hold",
        fallbackLabel: "พักโครงการ",
        icon: PauseCircle,
        color: "text-amber-500",
        badgeBg: "bg-amber-500/10",
        badgeText: "text-amber-500 dark:text-amber-400",
        badgeBorder: "border-amber-500/25",
        lineGradient: "from-amber-500/70 via-amber-500/25 to-transparent",
    },
    {
        key: "Completed",
        labelKey: "completed",
        fallbackLabel: "เสร็จสิ้น",
        icon: CheckCircle2,
        color: "text-emerald-500",
        badgeBg: "bg-emerald-500/10",
        badgeText: "text-emerald-500 dark:text-emerald-400",
        badgeBorder: "border-emerald-500/25",
        lineGradient: "from-emerald-500/70 via-emerald-500/25 to-transparent",
    },
]

type SortOption = 'recent' | 'name' | 'start_date' | 'end_date'

function sortProjectItems<T extends { name: string; startDate: string; endDate: string; updatedAt?: string; createdAt?: string }>(items: T[], sortBy: SortOption): T[] {
    return [...items].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name)
            case 'start_date':
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            case 'end_date':
                return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
            case 'recent':
            default: {
                const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
                const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
                return timeB - timeA
            }
        }
    })
}

export default function ProjectsPage() {
    const { t } = useTranslation()
    const { projects, archivedProjects, expenses, tasks, isLoading, archiveProject, unarchiveProject } = useProjects()
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL-based State
    const searchQuery = searchParams.get("q") || ""
    const statusFilter = searchParams.get("status") || null
    const showArchived = searchParams.get("archived") === "true"
    const [columns, setColumns] = useState<1 | 2 | 3 | 'auto'>(3)

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

    const [sortBy, setSortBy] = useState<SortOption>('recent')

    // Filter base projects by search
    const sourceProjects = showArchived ? archivedProjects : projects
    const searchedProjects = useMemo(() => {
        return sourceProjects.filter(project => {
            if (!searchQuery) return true
            return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.location.toLowerCase().includes(searchQuery.toLowerCase())
        })
    }, [sourceProjects, searchQuery])

    // Group into sections
    const projectSections = useMemo(() => {
        const activeConfigs = statusFilter
            ? STATUS_SECTIONS.filter(sec => sec.key === statusFilter)
            : STATUS_SECTIONS

        const sections: {
            config: StatusConfig
            items: typeof projects
            totalBudget: number
        }[] = []

        activeConfigs.forEach(config => {
            const items = searchedProjects.filter(p => p.status === config.key)
            // When filtering by specific status, always show section even if 0 items (to show empty state inside it or header)
            // When viewing All, only show sections that have items > 0
            if (items.length > 0 || (statusFilter && statusFilter === config.key)) {
                const sortedItems = sortProjectItems(items, sortBy)
                const totalBudget = items.reduce((sum, p) => {
                    const val = parseInt(String(p.budget || "0").replace(/[^0-9]/g, '')) || 0
                    return sum + val
                }, 0)
                sections.push({
                    config,
                    items: sortedItems,
                    totalBudget
                })
            }
        })

        // Catch-all for projects with unknown or other statuses
        if (!statusFilter) {
            const knownKeys = new Set(STATUS_SECTIONS.map(s => s.key))
            const otherItems = searchedProjects.filter(p => !knownKeys.has(p.status))
            if (otherItems.length > 0) {
                const sortedItems = sortProjectItems(otherItems, sortBy)
                const totalBudget = otherItems.reduce((sum, p) => {
                    const val = parseInt(String(p.budget || "0").replace(/[^0-9]/g, '')) || 0
                    return sum + val
                }, 0)
                sections.push({
                    config: {
                        key: "Other",
                        labelKey: "planning",
                        fallbackLabel: "อื่นๆ",
                        icon: Layers,
                        color: "text-muted-foreground",
                        badgeBg: "bg-muted",
                        badgeText: "text-muted-foreground",
                        badgeBorder: "border-border",
                        lineGradient: "from-muted-foreground/40 via-muted-foreground/10 to-transparent",
                    },
                    items: sortedItems,
                    totalBudget
                })
            }
        }

        return sections
    }, [searchedProjects, statusFilter, sortBy])

    const totalVisibleProjects = useMemo(() => {
        return projectSections.reduce((acc, s) => acc + s.items.length, 0)
    }, [projectSections])

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
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
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

            {/* Projects Sections */}
            {isLoading ? (
                <div className={cn(
                    "grid gap-6 transition-all duration-300 ease-in-out",
                    columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                    columns === 1 && "grid-cols-1",
                    columns === 2 && "grid-cols-1 sm:grid-cols-2",
                    columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                    {Array.from({ length: 6 }).map((_, i) => (
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
                    ))}
                </div>
            ) : totalVisibleProjects > 0 ? (
                <div className="space-y-12">
                    {projectSections.map(({ config, items, totalBudget }, sectionIdx) => {
                        const Icon = config.icon
                        const statusLabel = ((t.projects?.status as Record<string, string>) || {})[config.labelKey] || config.fallbackLabel

                        return (
                            <section key={config.key} className="space-y-5">
                                {/* Section Header & Glowing Divider Line */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between gap-3 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                "p-2 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
                                                config.badgeBg,
                                                config.badgeBorder
                                            )}>
                                                <Icon className={cn("w-4 h-4", config.color)} />
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                                    {statusLabel}
                                                </h2>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums border shadow-sm",
                                                    config.badgeBg,
                                                    config.badgeText,
                                                    config.badgeBorder
                                                )}>
                                                    {items.length} {t.common?.projects || "โครงการ"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Total Budget Summary for Section */}
                                        {totalBudget > 0 && (
                                            <div className="text-xs font-medium text-muted-foreground hidden sm:flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-white/5">
                                                <span>{t.projects?.budget || "งบประมาณรวม"}:</span>
                                                <span className="font-semibold text-foreground">฿{totalBudget.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Prominent Section Divider Line with colored gradient accent */}
                                    <div className="relative h-px w-full bg-border/60">
                                        <div className={cn("absolute left-0 top-0 h-0.5 w-36 rounded-full bg-gradient-to-r", config.lineGradient)} />
                                    </div>
                                </div>

                                {/* Section Cards Grid */}
                                {items.length > 0 ? (
                                    <div className={cn(
                                        "grid gap-6 transition-all duration-300 ease-in-out",
                                        columns === 'auto' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                                        columns === 1 && "grid-cols-1",
                                        columns === 2 && "grid-cols-1 sm:grid-cols-2",
                                        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                    )}>
                                        {items.map((project, idx) => {
                                            const budgetValue = parseInt(String(project.budget || "0").replace(/[^0-9]/g, '')) || 0
                                            const projectExpenses = getProjectExpenses[project.id] || 0
                                            const taskCount = getProjectTaskCount[project.id] || 0

                                            return (
                                                <div key={project.id} className={cn(
                                                    "h-full",
                                                    columns === 1 && "h-80",
                                                    columns === 2 && "h-72",
                                                    columns === 3 && "h-72"
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
                                                            status: project.status
                                                        }}
                                                        columns={columns as 1 | 2 | 3}
                                                        priority={sectionIdx === 0 && idx < 4}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-white/10">
                                        <p className="text-sm">{t.projects?.empty || "ไม่พบโครงการในหมวดนี้"}</p>
                                    </div>
                                )}
                            </section>
                        )
                    })}
                </div>
            ) : (
                <div className="py-16 text-center text-muted-foreground">
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
    )
}
