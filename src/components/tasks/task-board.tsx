"use client"

import React, { useState, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ProjectTask, User } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { Calendar, Check, Trash2 } from "lucide-react"

// Types
type BoardProps = {
    projectId: string
    tasks: ProjectTask[]
    users: User[]
    currentUser: User | null
    userFilter: string
    onUpdateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void
    onDeleteTask: (projectId: string, taskId: string) => void
    onToggleTask: (projectId: string, taskId: string) => void
    onSelectTask?: (taskId: string) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any // Translation object
}

type SortableTaskItemProps = {
    task: ProjectTask
    projectUsers: User[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    onDelete: (id: string) => void
    onToggle: (id: string) => void
    onSelect?: (id: string) => void
}

// --- Inner Components ---

function TaskCard({ task, projectUsers, t, onDelete, onToggle, onSelect, isOverlay = false }: SortableTaskItemProps & { isOverlay?: boolean }) {
    const priorityColors: Record<string, string> = {
        High: "bg-red-500/10 text-red-500 border-red-500/20",
        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    const handleCardClick = (e: React.MouseEvent) => {
        // Only trigger onSelect if not clicking on buttons
        if ((e.target as HTMLElement).closest('button')) return
        if (onSelect) onSelect(task.id)
    }

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "glass-card w-full p-4 rounded-xl border border-white/5 relative group bg-card/50",
                task.status === 'Done' && "opacity-75",
                isOverlay ? "cursor-grabbing shadow-2xl scale-105 border-primary/50" : "hover:border-primary/20 hover:-translate-y-1 transition-all cursor-pointer"
            )}>
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                    priorityColors[task.priority] || priorityColors.Low
                )}>
                    {task.priority || "Low"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                        onClick={() => onToggle(task.id)}
                        className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                            task.status === 'Done' ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-primary"
                        )}
                    >
                        {task.status === 'Done' && <Check className="w-3 h-3" />}
                    </button>
                    {!isOverlay && (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => onDelete(task.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <h4 className={cn("font-semibold text-sm mb-2 leading-snug break-words", task.status === 'Done' && "line-through text-muted-foreground")}>
                {task.title}
            </h4>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                    {/* Multi-Assignee Avatar Stack */}
                    {(task.assignedTo && task.assignedTo.length > 0) ? (
                        <div className="flex -space-x-1.5">
                            {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).slice(0, 3).map((userId, idx) => {
                                const user = projectUsers.find(u => u.id === userId || u.name === userId)
                                return (
                                    <div
                                        key={userId}
                                        className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-card text-[9px] font-bold text-primary"
                                        title={user?.name || userId}
                                    >
                                        {(user?.name || userId || "U").charAt(0).toUpperCase()}
                                    </div>
                                )
                            })}
                            {Array.isArray(task.assignedTo) && task.assignedTo.length > 3 && (
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-card text-[8px] font-bold text-muted-foreground">
                                    +{task.assignedTo.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[11px] font-medium text-muted-foreground">Unassigned</span>
                    )}
                </div>
                {(task.startDate || task.dueDate) && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                        task.status === 'Done' ? 'text-green-500' : 'text-orange-500'
                    )}>
                        <Calendar className="w-3 h-3" />
                        {(() => {
                            const formatDate = (iso?: string) => {
                                if (!iso) return null;
                                const date = new Date(iso);
                                if (isNaN(date.getTime())) return null;

                                const day = date.getDate();
                                const month = date.toLocaleString('en-GB', { month: 'short' });
                                return `${day} ${month}`;
                            };

                            const start = formatDate(task.startDate || task.dueDate);
                            const end = formatDate(task.endDate);

                            if (start && end && start !== end) {
                                // Simplify if same day? 
                                // e.g. "19 Jan, 14:00 - 16:00"
                                const startDateObj = new Date(task.startDate || task.dueDate || "");
                                const endDateObj = new Date(task.endDate || "");

                                if (startDateObj.toDateString() === endDateObj.toDateString()) {
                                    // Same day
                                    const startTime = startDateObj.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                                    const endTime = endDateObj.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                                    return `${startDateObj.getDate()} ${startDateObj.toLocaleString('en-GB', { month: 'short' })}, ${startTime} - ${endTime}`;
                                }
                                return `${start} - ${end}`;
                            }

                            return start || task.dueDate;
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}

function SortableTaskItem(props: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.task.id, data: { task: props.task } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="mb-3 touch-none" // touch-none is critical for Dnd on mobile to prevent scrolling while dragging
        >
            <TaskCard {...props} />
        </div>
    )
}

function DroppableColumn({ id, title, tasks, statusColor, count, children }: { id: string, title: string, tasks: ProjectTask[], statusColor: string, count: number, children: React.ReactNode }) {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
            type: "Column",
            status: id
        }
    })

    return (
        <div ref={setNodeRef} className="flex-1 flex flex-col h-full bg-muted/30 dark:bg-muted/10 rounded-2xl border border-white/5 overflow-hidden min-w-[280px]">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-muted/20 backdrop-blur-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shadow-lg ring-2 ring-opacity-20", statusColor.replace('bg-', 'ring-'))} style={{ backgroundColor: 'currentColor' }} />
                    <span className={cn(
                        id === 'Todo' ? 'text-slate-500' :
                            id === 'In Progress' ? 'text-blue-500' :
                                'text-green-500'
                    )}>
                        {title}
                    </span>
                    <span className="ml-1 text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-white/5 font-medium">
                        {count}
                    </span>
                </h3>
            </div>

            <div className="flex-1 p-3 overflow-y-auto scrollbar-hide">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 rounded-xl border-2 border-dashed border-muted flex items-center justify-center p-4 text-center opacity-50">
                        <p className="text-xs text-muted-foreground font-medium">Drop here</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Main TaskBoard Component ---

export function TaskBoard({
    projectId,
    tasks,
    users,
    currentUser,
    userFilter,
    onUpdateTask,
    onDeleteTask,
    onToggleTask,
    onSelectTask,
    t
}: BoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [originalStatus, setOriginalStatus] = useState<string | null>(null)
    const [localTasks, setLocalTasks] = useState<ProjectTask[]>([])

    // Sync local tasks with props, but allow local override during drag? 
    // Actually, simple way: update localTasks whenever tasks prop changes, 
    // but we need to handle the optimistic update carefully.
    useEffect(() => {
        setLocalTasks(tasks)
    }, [tasks])


    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Filter logic (supports multi-assign array)
    const filteredTasks = localTasks.filter(task => {
        if (userFilter !== "all") {
            // Support both array and legacy string
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : [])
            return assignees.includes(userFilter)
        }
        return true
    })

    const columns = {
        Todo: filteredTasks.filter(t => t.status === "Todo"),
        "In Progress": filteredTasks.filter(t => t.status === "In Progress"),
        Done: filteredTasks.filter(t => t.status === "Done")
    }

    const handleDragStart = (event: DragStartEvent) => {
        const task = event.active.data.current?.task
        setActiveId(event.active.id as string)
        setOriginalStatus(task?.status || null)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find items
        const isActiveTask = active.data.current?.task
        const isOverTask = over.data.current?.task
        const isOverColumn = over.data.current?.type === "Column"

        if (!isActiveTask) return

        // 1. Dragging over another task
        if (isActiveTask && isOverTask) {
            if (isActiveTask.status !== isOverTask.status) {
                // Cross-column drag over (visual)
                // We don't commit to DB here, just update local state for smooth UI
                setLocalTasks((items) => {
                    const activeIndex = items.findIndex((t) => t.id === activeId)
                    const overIndex = items.findIndex((t) => t.id === overId)

                    if (items[activeIndex].status !== items[overIndex].status) {
                        const newItems = [...items]
                        newItems[activeIndex] = { ...newItems[activeIndex], status: items[overIndex].status }
                        return arrayMove(newItems, activeIndex, overIndex - 1 < 0 ? 0 : overIndex) // Insert before
                    }
                    return arrayMove(items, activeIndex, overIndex)
                })
            }
        }

        // 2. Dragging over a column (empty area)
        if (isActiveTask && isOverColumn) {
            const overStatus = over.data.current?.status
            if (isActiveTask.status !== overStatus) {
                setLocalTasks((items) => {
                    const activeIndex = items.findIndex((t) => t.id === activeId)
                    const newItems = [...items]
                    newItems[activeIndex] = { ...newItems[activeIndex], status: overStatus }
                    // Move to end of that column conceptually, but here just updating status is enough 
                    // arrayMove isn't needed strictly if we just filter by status, 
                    // but it helps to keep order stable if we were tracking order index.
                    return newItems
                })
            }
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) {
            setOriginalStatus(null)
            return
        }

        const activeData = active.data.current?.task

        // Determine new status
        let newStatus = activeData?.status

        if (over.data.current?.type === "Column") {
            newStatus = over.data.current.status
        } else if (over.data.current?.task) {
            newStatus = over.data.current.task.status
        }

        // Compare against original status (before any optimistic updates)
        if (activeData && originalStatus && originalStatus !== newStatus) {
            // Commit to DB
            onUpdateTask(projectId, activeData.id, { status: newStatus })
        }
        setOriginalStatus(null)
    }

    const getStatusTranslation = (status: string) => {
        switch (status) {
            case 'Todo': return t?.projects?.detail?.tasks?.status?.todo || status
            case 'In Progress': return t?.projects?.detail?.tasks?.status?.in_progress || status
            case 'Done': return t?.projects?.detail?.tasks?.status?.done || status
            default: return status
        }
    }

    const statusColors: Record<string, string> = {
        Todo: "bg-slate-500",
        "In Progress": "bg-blue-500",
        Done: "bg-green-500"
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 h-[85vh] min-h-[800px] min-w-[800px] pb-4 px-1">
                {(["Todo", "In Progress", "Done"] as const).map((status) => (
                    <DroppableColumn
                        key={status}
                        id={status}
                        title={getStatusTranslation(status)}
                        tasks={columns[status]}
                        statusColor={statusColors[status]}
                        count={columns[status].length}
                    >
                        {columns[status].map((task) => (
                            <SortableTaskItem
                                key={task.id}
                                task={task}
                                projectUsers={users}
                                t={t}
                                onDelete={(id) => onDeleteTask(projectId, id)}
                                onToggle={(id) => onToggleTask(projectId, id)}
                                onSelect={onSelectTask}
                            />
                        ))}
                    </DroppableColumn>
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <TaskCard
                        task={localTasks.find(t => t.id === activeId)!}
                        projectUsers={users}
                        t={t}
                        onDelete={() => { }}
                        onToggle={() => { }}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
