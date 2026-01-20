"use client"

import * as React from "react"
import { X, Calendar, User, Tag, Trash2, Clock, CheckCircle2, Layout, AlignLeft, Hash, ExternalLink, ChevronDown, Archive } from "lucide-react"
import { useProjects, Priority, TaskStatus, ProjectTask } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface TaskDetailSheetProps {
    taskId: string | null
    onClose: () => void
}

export default function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
    const { projects, tasks, archivedTasks, updateTask, deleteTask, users, currentUser, archiveTask, unarchiveTask } = useProjects()

    // Find the task and its project
    const taskData = React.useMemo(() => {
        if (!taskId) return null
        // Search in both active and archived tasks to prevent flash/unmount
        const task = tasks.find(t => t.id === taskId) || archivedTasks.find(t => t.id === taskId)
        if (!task) return null

        const project = projects.find(p => p.id === task.projectId)
        return {
            task,
            projectId: task.projectId || "",
            projectName: project?.name || "Unknown Project"
        }
    }, [projects, tasks, archivedTasks, taskId])

    const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false)

    if (!taskId || !taskData) return null

    const { task, projectId, projectName } = taskData

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this task?")) {
            deleteTask(projectId, taskId)
            onClose()
        }
    }

    const handleArchiveConfirm = () => {
        if (task.isArchived) {
            unarchiveTask(projectId, taskId)
        } else {
            archiveTask(projectId, taskId)
        }
        // Close immediately for better UX
        onClose()
    }

    const priorityColors: Record<Priority, string> = {
        High: "bg-red-500/10 text-red-500 border-red-500/20",
        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    const isArchived = task.isArchived

    return (
        <>
            <ConfirmDialog
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchiveConfirm}
                title={isArchived ? "Restore งาน" : "Archive งาน"}
                message={isArchived ? "คุณต้องการนำงานนี้กลับมาหรือไม่?" : "คุณต้องการ Archive งานนี้หรือไม่?"}
                confirmText={isArchived ? "Restore" : "Archive"}
                cancelText="ยกเลิก"
                variant={isArchived ? "success" : "warning"}
            />
            <div className="fixed inset-0 z-[100] flex justify-end font-sans">
                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-xl bg-card/90 backdrop-blur-3xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col h-full">
                    {/* Header Actions */}
                    <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex items-center justify-between border-b border-white/5 shrink-0 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-all text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                                <Hash className="w-3 h-3 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">{projectName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {(task.status === 'Done' || isArchived) && (
                                <button
                                    onClick={() => setShowArchiveConfirm(true)}
                                    className={cn("p-2 rounded-full transition-all", isArchived ? "text-green-500 hover:bg-green-500/10" : "text-amber-500 hover:bg-amber-500/10")}
                                    title={isArchived ? "Restore Task" : "Archive Task"}
                                >
                                    <Archive className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {/* Status & Priority */}
                        <div className="flex flex-wrap gap-4">
                            <div className="space-y-2 flex-1 min-w-[200px]">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                                <select
                                    value={task.status}
                                    onChange={(e) => updateTask(projectId, task.id, { status: e.target.value as TaskStatus })}
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold appearance-none text-sm"
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                            <div className="space-y-2 flex-1 min-w-[200px]">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Priority</label>
                                <select
                                    value={task.priority}
                                    onChange={(e) => updateTask(projectId, task.id, { priority: e.target.value as Priority })}
                                    className={cn(
                                        "w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold appearance-none text-sm",
                                        priorityColors[task.priority]
                                    )}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Task Name</label>
                            </div>
                            <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTask(projectId, task.id, { title: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-3xl font-bold tracking-tight focus:ring-0 outline-none leading-tight placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-white/5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Assignee</span>
                                </div>
                                <div className="relative">
                                    <select
                                        value={task.assignedTo || ""}
                                        onChange={(e) => updateTask(projectId, task.id, { assignedTo: e.target.value })}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm appearance-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {currentUser && (
                                            <option value={currentUser.id} className="font-bold text-primary">
                                                Assign to Me ({currentUser.name})
                                            </option>
                                        )}
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground ml-1 uppercase font-bold text-green-500">Start</label>
                                        <input
                                            type="datetime-local"
                                            value={task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : (task.dueDate && task.dueDate.includes('T') ? new Date(task.dueDate).toISOString().slice(0, 16) : "")}
                                            onChange={(e) => updateTask(projectId, task.id, { startDate: new Date(e.target.value).toISOString() })}
                                            className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-medium text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground ml-1 uppercase font-bold text-red-500">End</label>
                                        <input
                                            type="datetime-local"
                                            value={task.endDate ? new Date(task.endDate).toISOString().slice(0, 16) : ""}
                                            onChange={(e) => updateTask(projectId, task.id, { endDate: new Date(e.target.value).toISOString(), dueDate: new Date(e.target.value).toISOString() })}
                                            className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlignLeft className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Description</span>
                            </div>
                            <textarea
                                value={task.description || ""}
                                placeholder="Add more details about this task..."
                                onChange={(e) => updateTask(projectId, task.id, { description: e.target.value })}
                                rows={6}
                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-white/5 bg-muted/20 shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full bg-background/50 hover:bg-background/80 text-foreground py-4 rounded-xl font-bold uppercase tracking-wider border border-white/10 transition-all active:scale-[0.98]"
                        >
                            Close Detail
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
