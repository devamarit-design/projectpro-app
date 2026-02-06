"use client"

import * as React from "react"
import { Plus, CheckCircle, Clock, MoreHorizontal, User, Search, Filter, Hash, ExternalLink, Archive } from "lucide-react"
import { useProjects, TaskStatus, ProjectTask, Priority } from "@/context/project-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

// Detailed interface for the UI including project info
interface DetailedTask extends ProjectTask {
    projectId: string
    projectName: string
}

import { useTranslation } from "@/lib/i18n-context"
import AddTaskDialog from "@/components/tasks/add-task-dialog"
import TaskDetailSheet from "@/components/tasks/task-detail-sheet"

// DnD Kit Imports
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    closestCorners,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableTaskCard } from "@/components/tasks/sortable-task-card"
import { TasksColumn } from "@/components/tasks/tasks-column"

export default function TasksPage() {
    const { projects, tasks, archivedTasks, updateTask, deleteTask, toggleTask, currentUser, users } = useProjects()
    const { t } = useTranslation()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [projectFilter, setProjectFilter] = React.useState<string>("all")
    const [userFilter, setUserFilter] = React.useState<string>("all")
    const [showArchived, setShowArchived] = React.useState(false)
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
    const [showAddTask, setShowAddTask] = React.useState(false)

    // Handle action=new from Quick Add menu
    React.useEffect(() => {
        const action = searchParams.get('action')
        const taskIdParam = searchParams.get('taskId')

        if (action === 'new') {
            setShowAddTask(true)
            router.replace('/tasks')
        } else if (taskIdParam) {
            setSelectedTaskId(taskIdParam)
            // Optional: Clean URL but keep history accessible? 
            // Better to keep it clean so refresh doesn't reopen if user closed it.
            // But replacing immediately might prevent user from seeing it in address bar?
            // Let's replace.
            router.replace('/tasks')
        }
    }, [searchParams, router])

    // DnD State
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { opacity: 0.1, distance: 5 }
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 100, tolerance: 5 }
        })
    )

    // Aggregate all tasks from global state
    const allTasks: DetailedTask[] = React.useMemo(() => {
        const sourceTasks = showArchived ? archivedTasks : tasks
        return sourceTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId)
            // ... (rest of mapping)
            return {
                ...task,
                projectId: task.projectId || "",
                projectName: project?.name || "Unknown Project"
            }
        })
    }, [tasks, projects, showArchived, archivedTasks])

    // Filter tasks based on search and project
    const filteredTasks = React.useMemo(() => {
        return allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.projectName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesProject = projectFilter === "all" || task.projectId === projectFilter

            // User Filter (Optional for all roles now)
            let matchesUser = true
            if (userFilter !== "all") {
                const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : [])
                matchesUser = assignees.includes(userFilter)
            }

            return matchesSearch && matchesProject && matchesUser
        })
    }, [allTasks, searchQuery, projectFilter, userFilter])

    const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(task => task.status === status)

    const statusColors: Record<TaskStatus, string> = {
        Todo: "bg-slate-500",
        "In Progress": "bg-blue-500",
        Done: "bg-green-500"
    }

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) {
            setActiveId(null)
            return
        }

        const activeTaskId = active.id as string
        const activeTask = allTasks.find(t => t.id === activeTaskId)

        // Find which column (container) we dropped into
        // The container ID is the status (e.g., "Todo", "In Progress")
        // Or it could be another task in that column
        let newStatus: TaskStatus | undefined

        // Check if dropped directly on a container (column)
        if ((["Todo", "In Progress", "Done"] as const).includes(over.id as any)) {
            newStatus = over.id as TaskStatus
        } else {
            // Dropped over another item, find that item's status
            const overTask = allTasks.find(t => t.id === over.id)
            if (overTask) {
                newStatus = overTask.status
            }
        }

        if (activeTask && newStatus && activeTask.status !== newStatus) {
            // Update Task Status in Database
            updateTask(activeTask.projectId, activeTaskId, { status: newStatus })
        }

        setActiveId(null)
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    }

    const activeTask = activeId ? allTasks.find(t => t.id === activeId) : null

    return (
        <div className="space-y-6 flex flex-col pb-6">
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">{t.tasks.title}</h1>
                        <p className="text-muted-foreground mt-1">{t.tasks.subtitle}</p>
                    </div>
                </div>

                {/* Search Bar - Moved to Top for Mobile Visibility */}
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t.tasks.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm shadow-sm"
                    />
                </div>

                {/* Actions Row: New Task & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-hide">
                        <div className="relative min-w-[180px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none relative z-0"
                            >
                                <option value="all">{t.tasks.filters.all_projects}</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground rotate-90" />
                            </div>
                        </div>

                        <div className="relative min-w-[150px]">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none relative z-0"
                            >
                                <option value="all">{t.tasks.filters.all_users}</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground rotate-90" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={cn(
                                "px-3 py-2 border rounded-xl transition-all duration-300 flex items-center gap-2",
                                showArchived
                                    ? "bg-gray-500/20 text-gray-500 border-gray-500/50"
                                    : "bg-background/50 border-white/10 hover:bg-muted/50 text-muted-foreground"
                            )}
                            title={showArchived ? "Show Active Tasks" : "Show Archived Tasks"}
                        >
                            <Archive className="w-4 h-4" />
                            {showArchived && <span className="text-xs font-semibold">Archived</span>}
                        </button>


                        <button
                            onClick={() => setShowAddTask(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto justify-center whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            {t.tasks.new_task}
                        </button>
                    </div>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto min-h-0">
                    <div className="flex gap-6 h-[85vh] min-h-[800px] min-w-[1000px] pb-4 px-1">
                        {/* Kanban Columns */}
                        {(["Todo", "In Progress", "Done"] as const).map((status) => {
                            const tasksInColumn = getTasksByStatus(status)

                            return (
                                <TasksColumn
                                    key={status}
                                    status={status}
                                    title={status === 'Todo' ? t.tasks.status.todo : status === 'In Progress' ? t.tasks.status.in_progress : t.tasks.status.done}
                                    tasks={tasksInColumn}
                                    statusColor={statusColors[status]}
                                    onAddTask={() => setShowAddTask(true)}
                                    onSelectTask={setSelectedTaskId}
                                    t={t}
                                    users={users}
                                />
                            )
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <SortableTaskCard
                            task={activeTask}
                            status={activeTask.status}
                            onSelect={() => { }} // No-op during drag
                            users={users}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Task Detail Sheet & Add Task Dialog */}
            <AddTaskDialog isOpen={showAddTask} onClose={() => setShowAddTask(false)} />
            <TaskDetailSheet taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        </div>
    )
}
