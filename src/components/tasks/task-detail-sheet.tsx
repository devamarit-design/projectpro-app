"use client"

import * as React from "react"
import { createPortal } from "react-dom"
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
    const [isSaving, setIsSaving] = React.useState(false)

    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Local State for all editable fields
    const [localTask, setLocalTask] = React.useState<{
        title: string;
        description: string;
        status: TaskStatus;
        priority: Priority;
        assignedTo: string[];
        startDate?: string;
        endDate?: string;
    }>({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        assignedTo: []
    })

    // Reset local state when task changes
    React.useEffect(() => {
        if (taskData?.task) {
            const t = taskData.task
            setLocalTask({
                title: t.title || "",
                description: t.description || "",
                status: t.status || "Todo",
                priority: t.priority || "Medium",
                assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : []),
                startDate: t.startDate || undefined,
                endDate: t.endDate || undefined
            })
        }
    }, [taskData?.task?.id])

    const hasChanges = React.useMemo(() => {
        if (!taskData?.task) return false
        const t = taskData.task
        const originalAssigned = Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : [])
        return (
            localTask.title !== t.title ||
            localTask.description !== (t.description || "") ||
            localTask.status !== t.status ||
            localTask.priority !== t.priority ||
            JSON.stringify(localTask.assignedTo) !== JSON.stringify(originalAssigned) ||
            localTask.startDate !== t.startDate ||
            localTask.endDate !== t.endDate
        )
    }, [localTask, taskData?.task])

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
        onClose()
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const updates: Partial<ProjectTask> = {
                title: localTask.title,
                description: localTask.description,
                status: localTask.status,
                priority: localTask.priority as any,
                assignedTo: localTask.assignedTo,
            }

            // Only include dates if they are not undefined
            if (localTask.startDate !== undefined) updates.startDate = localTask.startDate;
            if (localTask.endDate !== undefined) {
                updates.endDate = localTask.endDate;
                updates.dueDate = localTask.endDate; // Keep dueDate in sync
            }

            await updateTask(projectId, task.id, updates)
            setIsSaving(false)
            onClose() // Close after save for better workflow
        } catch (error) {
            console.error("Failed to save task:", error)
            alert("Failed to save. Please try again.")
            setIsSaving(false)
        }
    }

    const statusColors: Record<TaskStatus, string> = {
        "Todo": "bg-slate-500/10 text-slate-500 border-slate-500/20",
        "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        "Done": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }

    const priorityColors: Record<Priority, string> = {
        High: "bg-red-500/10 text-red-500 border-red-500/20",
        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    const isArchived = task.isArchived

    if (!mounted) return null

    return createPortal(
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
                    <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex items-center justify-between border-b border-white/5 shrink-0 bg-muted/20 relative z-50">
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

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {/* Status & Priority - Upgraded UI */}
                        <div className="flex flex-wrap gap-6">
                            <div className="space-y-3 flex-1 min-w-[200px]">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                                <div className="flex gap-1 bg-background/50 p-1 rounded-xl border border-white/5">
                                    {(["Todo", "In Progress", "Done"] as TaskStatus[]).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setLocalTask(prev => ({ ...prev, status: s }))}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                                                localTask.status === s
                                                    ? statusColors[s] + " shadow-lg shadow-black/20 scale-105 z-10"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 flex-1 min-w-[200px]">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Priority</label>
                                <div className="flex gap-1 bg-background/50 p-1 rounded-xl border border-white/5">
                                    {(["Low", "Medium", "High"] as Priority[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setLocalTask(prev => ({ ...prev, priority: p }))}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                                                localTask.priority === p
                                                    ? priorityColors[p] + " shadow-lg shadow-black/20 scale-105 z-10"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Task Name</label>
                            </div>
                            <input
                                type="text"
                                value={localTask.title}
                                onChange={(e) => setLocalTask(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-3xl font-bold tracking-tight focus:ring-0 outline-none leading-tight placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-white/5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Assignees</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    {localTask.assignedTo.length > 0 ? (
                                        <div className="flex -space-x-2">
                                            {localTask.assignedTo.slice(0, 5).map((userId) => {
                                                const user = users.find(u => u.id === userId) || currentUser
                                                return (
                                                    <div
                                                        key={userId}
                                                        className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-bold text-primary"
                                                        title={user?.name || userId}
                                                    >
                                                        {(user?.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                )
                                            })}
                                            {localTask.assignedTo.length > 5 && (
                                                <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                    +{localTask.assignedTo.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Unassigned</span>
                                    )}
                                </div>
                                {/* Multi-select dropdown - Optimization: instant local update */}
                                <div className="space-y-1 max-h-48 overflow-y-auto bg-background/50 border border-white/10 rounded-xl p-3 custom-scrollbar">
                                    {currentUser && (
                                        <label className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={localTask.assignedTo.includes(currentUser.id)}
                                                    onChange={(e) => {
                                                        const updated = e.target.checked
                                                            ? [...localTask.assignedTo, currentUser.id]
                                                            : localTask.assignedTo.filter(id => id !== currentUser.id)
                                                        setLocalTask(prev => ({ ...prev, assignedTo: updated }))
                                                    }}
                                                    className="w-4 h-4 rounded border-white/20 bg-background/50 text-primary focus:ring-primary/50 transition-all cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-primary group-hover:translate-x-0.5 transition-transform">Me ({currentUser.name})</span>
                                        </label>
                                    )}
                                    {users.filter(u => u.id !== currentUser?.id).map(user => (
                                        <label key={user.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={localTask.assignedTo.includes(user.id)}
                                                    onChange={(e) => {
                                                        const updated = e.target.checked
                                                            ? [...localTask.assignedTo, user.id]
                                                            : localTask.assignedTo.filter(id => id !== user.id)
                                                        setLocalTask(prev => ({ ...prev, assignedTo: updated }))
                                                    }}
                                                    className="w-4 h-4 rounded border-white/20 bg-background/50 text-foreground/70 focus:ring-primary/50 transition-all cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-sm font-medium group-hover:translate-x-0.5 transition-transform">{user.name}</span>
                                        </label>
                                    ))}
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
                                            value={(() => {
                                                try {
                                                    const d = localTask.startDate || (task.dueDate && task.dueDate.includes('T') ? task.dueDate : null)
                                                    if (!d) return ""
                                                    const date = new Date(d)
                                                    if (isNaN(date.getTime())) return ""
                                                    const offset = date.getTimezoneOffset()
                                                    return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 16)
                                                } catch (e) {
                                                    return ""
                                                }
                                            })()}
                                            onChange={(e) => {
                                                const date = new Date(e.target.value)
                                                if (!isNaN(date.getTime())) {
                                                    setLocalTask(prev => ({ ...prev, startDate: date.toISOString() }))
                                                }
                                            }}
                                            className="w-full bg-background/50 border border-white/10 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-medium text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground ml-1 uppercase font-bold text-red-500">End</label>
                                        <input
                                            type="datetime-local"
                                            value={(() => {
                                                try {
                                                    if (!localTask.endDate) return ""
                                                    const date = new Date(localTask.endDate)
                                                    if (isNaN(date.getTime())) return ""
                                                    const offset = date.getTimezoneOffset()
                                                    return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 16)
                                                } catch (e) {
                                                    return ""
                                                }
                                            })()}
                                            onChange={(e) => {
                                                const date = new Date(e.target.value)
                                                if (!isNaN(date.getTime())) {
                                                    setLocalTask(prev => ({ ...prev, endDate: date.toISOString() }))
                                                }
                                            }}
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
                                value={localTask.description}
                                placeholder="Add more details about this task..."
                                onChange={(e) => setLocalTask(prev => ({ ...prev, description: e.target.value }))}
                                rows={6}
                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm resize-none leading-relaxed custom-scrollbar"
                            />
                        </div>

                        {/* Images */}
                        {task.images && task.images.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Attachments</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {task.images.map((url, index) => (
                                        <div key={index} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 group">
                                            <img
                                                src={url}
                                                alt={`Task attachment ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Improved Footer with Save Button */}
                    <div className="p-8 border-t border-white/5 bg-muted/20 shrink-0 flex flex-col gap-3">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-[0.98]",
                                hasChanges
                                    ? "bg-transparent hover:bg-white/5 text-muted-foreground text-sm"
                                    : "bg-background/50 hover:bg-background/80 text-foreground border border-white/10"
                            )}
                        >
                            {hasChanges ? "Cancel Changes" : "Close Detail"}
                        </button>
                    </div>

                </div>
            </div>
        </>,
        document.body
    )
}
