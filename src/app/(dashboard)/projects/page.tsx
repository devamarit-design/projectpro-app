"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { Search, Plus, Filter, Calendar, MapPin, MoreHorizontal } from "lucide-react"
import { useState, useMemo } from "react"

import { useProjects } from "@/context/project-context"

export default function ProjectsPage() {
    const { t } = useTranslation()
    const { projects, expenses, isLoading } = useProjects()
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

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

    // Filter logic
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter ? project.status === statusFilter : true

        return matchesSearch && matchesStatus
    })

    const statuses = [
        { label: t.projects.status.in_progress, value: "In Progress" },
        { label: t.projects.status.completed, value: "Completed" },
        { label: t.projects.status.on_hold, value: "On Hold" }
    ]

    return (
        <div className="space-y-6 pb-20">
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
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t.projects.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 border rounded-xl transition-all duration-300 ${showFilters || statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 border-white/10 hover:bg-muted/50 text-muted-foreground'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Chips - Expandable */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showFilters ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                onClick={() => setStatusFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === null
                                    ? 'bg-primary/20 text-primary border-primary/20'
                                    : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50'}`}
                            >
                                {t.projects.status.all}
                            </button>
                            {statuses.map(status => (
                                <button
                                    key={status.value}
                                    onClick={() => setStatusFilter(status.value === statusFilter ? null : status.value)}
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    // Skeleton Loading State
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-muted/10 animate-pulse">
                            <div className="h-48 bg-muted/20 w-full" />
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
                    filteredProjects.map((project) => (
                        <Link href={`/projects/detail?id=${project.id}`} key={project.id} className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/5 block">
                            {/* Project Image */}
                            <div className="h-48 w-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <img
                                    src={project.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80"}
                                    alt={project.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 z-20">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${project.status === 'Completed' ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                                        project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' :
                                            'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {project.status === 'In Progress' ? t.projects.status.in_progress :
                                            project.status === 'Completed' ? t.projects.status.completed :
                                                t.projects.status.on_hold}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 z-20 text-white">
                                    <h3 className="font-bold text-lg">{project.name}</h3>
                                    <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {project.location}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t.projects.customer}</span>
                                    <span className="font-medium">{project.customer}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t.projects.budget}</span>
                                    <span className="font-medium">{project.budget}</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    {(() => {
                                        const projectExpenses = getProjectExpenses[project.id] || 0
                                        const budgetValue = parseInt(String(project.budget || "0").replace(/[^0-9]/g, '')) || 1
                                        const costPercent = Math.min(Math.round((projectExpenses / budgetValue) * 100), 100)
                                        return (
                                            <>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">{t.projects.cost_value}</span>
                                                    <span className="font-medium text-primary">
                                                        {costPercent}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                        style={{ width: `${costPercent}%` }}
                                                    />
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>

                                {/* Footer */}
                                <div className="pt-2 flex justify-between items-center border-t border-border/50">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>{t.projects.due}: {project.endDate}</span>
                                    </div>
                                    <button className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
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
