"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Suspense } from "react"
import Link from "next/link"
import {
    FolderKanban,
    CheckSquare,
    CreditCard,
    ArrowRight,
    Search as SearchIcon
} from "lucide-react"

function SearchResultsContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") || ""
    const { projects, currentUser } = useProjects() // In a real app, you'd search tasks/expenses too from global context or API
    const { t } = useTranslation()

    // Filter Logic
    const filteredProjects = React.useMemo(() => {
        if (!query) return []
        const lowerQuery = query.toLowerCase()
        return projects.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.customer.toLowerCase().includes(lowerQuery) ||
            p.location?.toLowerCase().includes(lowerQuery)
        )
    }, [projects, query])

    // Mock search for tasks (aggregating from projects)
    const filteredTasks = React.useMemo(() => {
        if (!query) return []
        const lowerQuery = query.toLowerCase()
        const allTasks = projects.flatMap(p => p.tasks?.map(t => ({ ...t, projectName: p.name, projectId: p.id })) || [])
        return allTasks.filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.assignedTo?.toLowerCase().includes(lowerQuery)
        )
    }, [projects, query])

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{t.search.enter_term}</h2>
                <p className="text-muted-foreground">{t.search.search_hint}</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">{t.search.title}</h1>
                <p className="text-muted-foreground">
                    {t.search.found_results.replace('{{count}}', (filteredProjects.length + filteredTasks.length).toString()).replace('{{query}}', query)}
                </p>
            </div>

            {/* Projects Section */}
            {filteredProjects.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-primary" />
                        {t.search.sections.projects}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.map(project => (
                            <Link
                                key={project.id}
                                href={`/projects/detail?id=${project.id}`}
                                className="block p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground">{project.customer}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                        {project.status}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-muted-foreground gap-4">
                                    <span>{project.location}</span>
                                    <span>{project.progress}% Complete</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Tasks Section */}
            {filteredTasks.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-orange-500" />
                        {t.search.sections.tasks}
                    </h2>
                    <div className="bg-card border border-border rounded-xl divide-y divide-border">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <h3 className="font-medium">{task.title}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {t.search.in_project} <span className="font-semibold text-foreground">{task.projectName}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        task.priority === 'High' ? "bg-red-500/10 text-red-500" :
                                            task.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500" :
                                                "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {task.priority}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {filteredProjects.length === 0 && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-muted-foreground">{t.search.no_results}</p>
                    <p className="text-sm text-muted-foreground mt-2">{t.search.adjust_terms}</p>
                </div>
            )}
        </div>
    )
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    )
}
