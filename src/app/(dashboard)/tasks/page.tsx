"use client"

import * as React from "react"
import { Plus, CheckCircle, Clock, MoreHorizontal, User, Search, Filter, Hash, ExternalLink } from "lucide-react"
import { useProjects, TaskStatus, ProjectTask, Priority } from "@/context/project-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Detailed interface for the UI including project info
interface DetailedTask extends ProjectTask {
    projectId: string
    projectName: string
}

import { useTranslation } from "@/lib/i18n-context"
import AddTaskDialog from "@/components/tasks/add-task-dialog"
import TaskDetailSheet from "@/components/tasks/task-detail-sheet"

export default function TasksPage() {
    const { projects, updateTask, deleteTask, toggleTask, currentUser, users } = useProjects()
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [projectFilter, setProjectFilter] = React.useState<string>("all")
    const [userFilter, setUserFilter] = React.useState<string>("all")
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
    const [showAddTask, setShowAddTask] = React.useState(false)

    // Aggregate all tasks from all projects
    const allTasks: DetailedTask[] = React.useMemo(() => {
        return projects.flatMap(project =>
            (project.tasks || []).map(task => ({
                ...task,
                projectId: project.id,
                projectName: project.name
            }))
        )
    }, [projects])

    // Filter tasks based on search, project, and user permissions
    const filteredTasks = React.useMemo(() => {
        const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

        return allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.projectName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesProject = projectFilter === "all" || task.projectId === projectFilter

            // User Permission Filtering
            let matchesUser = true
            if (isAdmin) {
                // Admin can see all or filter by specific user
                if (userFilter !== "all") {
                    matchesUser = task.assignedTo === userFilter
                }
            } else {
                // Non-admin can ONLY see their own tasks
                matchesUser = task.assignedTo === currentUser?.name
            }

            return matchesSearch && matchesProject && matchesUser
        })
    }, [allTasks, searchQuery, projectFilter, userFilter, currentUser])

    const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(task => task.status === status)

    const priorityColors: Record<Priority, string> = {
        High: "bg-red-500/10 text-red-500 border-red-500/20",
        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    const statusColors: Record<TaskStatus, string> = {
        Todo: "bg-slate-500",
        "In Progress": "bg-blue-500",
        Done: "bg-green-500"
    }

    return (
        <div className="space-y-6 flex flex-col pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">{t.tasks.title}</h1>
                    <p className="text-muted-foreground mt-1">{t.tasks.subtitle}</p>
                </div>
                <button
                    onClick={() => setShowAddTask(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    {t.tasks.new_task}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t.tasks.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
                    />
                </div>
                <div className="relative sm:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                    >
                        <option value="all">{t.tasks.filters.all_projects}</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground rotate-90" />
                    </div>
                </div>

                {(currentUser?.role === 'Owner' || currentUser?.role === 'Admin') && (
                    <div className="relative sm:w-48">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                        >
                            <option value="all">{t.tasks.filters.all_users}</option>
                            {users.map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground rotate-90" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-x-auto min-h-0">
                <div className="flex gap-6 h-[85vh] min-h-[800px] min-w-[1000px] pb-4 px-1">
                    {/* Kanban Columns */}
                    {(["Todo", "In Progress", "Done"] as const).map((status) => (
                        <div key={status} className="flex-1 flex flex-col h-full bg-muted/30 dark:bg-muted/10 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-muted/20 backdrop-blur-sm">
                                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full shadow-lg ring-2 ring-opacity-20", statusColors[status].replace('bg-', 'ring-'))} style={{ backgroundColor: 'currentColor' }} />
                                    <span className={cn(status === 'Todo' ? 'text-slate-500' : status === 'In Progress' ? 'text-blue-500' : 'text-green-500')}>
                                        {status === 'Todo' ? t.tasks.status.todo : status === 'In Progress' ? t.tasks.status.in_progress : t.tasks.status.done}
                                    </span>
                                    <span className="ml-1 text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-white/5 font-medium">
                                        {getTasksByStatus(status).length}
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                                {getTasksByStatus(status).map((task) => (
                                    <div
                                        key={`${task.projectId}-${task.id}`}
                                        onClick={() => setSelectedTaskId(task.id)}
                                        className="glass-card w-full p-4 rounded-xl border border-white/5 hover:border-primary/20 hover:-translate-y-1 cursor-pointer transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                                                priorityColors[task.priority]
                                            )}>
                                                {task.priority || "Low"}
                                            </span>
                                            {task.projectId && (
                                                <span className="text-[10px] text-muted-foreground/70 truncate max-w-[100px] ml-2">
                                                    {task.projectName}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors leading-snug">{task.title}</h4>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                                                    <User className="w-3 h-3 text-primary" />
                                                </div>
                                                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">{task.assignedTo || t.tasks.unassigned}</span>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                                                status === 'Done' ? 'text-green-500' : 'text-orange-500'
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {task.dueDate || t.tasks.no_date}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {getTasksByStatus(status).length === 0 && (
                                    <div className="h-24 rounded-xl border-2 border-dashed border-muted flex items-center justify-center p-4 text-center opacity-50 hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-muted-foreground font-medium">{t.tasks.empty}</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowAddTask(true)}
                                    className="w-full py-3 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-xs font-bold uppercase tracking-widest text-primary/70 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 group mt-2"
                                >
                                    <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                                    {t.tasks.add_task}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Detail Sheet & Add Task Dialog */}
            <AddTaskDialog isOpen={showAddTask} onClose={() => setShowAddTask(false)} />
            <TaskDetailSheet taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        </div>
    )
}
