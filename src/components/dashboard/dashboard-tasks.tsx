"use client"

import * as React from "react"
import { useProjects, Priority, TaskStatus } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

export function DashboardTasks() {
    const { projects, currentUser, tasks } = useProjects()
    const { t } = useTranslation()

    // Get tasks assigned to current user
    const userTasks = React.useMemo(() => {
        if (!currentUser) return []

        return tasks
            .filter(task => task.assignedTo === currentUser.id || task.assignedTo === currentUser.name)
            .map(task => ({
                ...task,
                projectName: projects.find(p => p.id === task.projectId)?.name || "Unknown Project"
            }))
            .sort((a, b) => {
                if (!a.dueDate) return 1
                if (!b.dueDate) return -1
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            })
            .slice(0, 5) // Show top 5
    }, [tasks, projects, currentUser])

    const priorityColors: Record<Priority, string> = {
        High: "text-red-500 bg-red-500/10 border-red-500/20",
        Medium: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        Low: "text-slate-500 bg-slate-500/10 border-slate-500/20"
    }

    if (!currentUser) return null

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        {t.dashboard.my_tasks}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.dashboard.pending_tasks_count.replace('{{count}}', String(userTasks.filter(t => t.status !== 'Done').length))}</p>
                </div>
                <Link href="/tasks" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    {t.dashboard.view_all} <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-3">
                {userTasks.length > 0 ? (
                    userTasks.map(task => (
                        <div key={`${task.projectId}-${task.id}`} className="group p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-white/5 transition-colors flex items-start gap-3">
                            <div className={cn("mt-1 w-2 h-2 rounded-full",
                                task.status === 'Done' ? "bg-green-500" :
                                    task.status === 'In Progress' ? "bg-blue-500" : "bg-slate-400"
                            )} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-medium text-muted-foreground truncate">{task.projectName}</span>
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", priorityColors[task.priority])}>
                                        {task.priority}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{task.title}</h4>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {task.dueDate || "No deadline"}
                                    </span>
                                    <span className={cn("text-xs font-medium",
                                        task.status === 'Done' ? "text-green-500" :
                                            task.status === 'In Progress' ? "text-blue-500" : "text-slate-500"
                                    )}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{t.dashboard.no_active_tasks}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
