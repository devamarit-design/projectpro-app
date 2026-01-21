"use client"

import * as React from "react"
import { X, Calendar, User, CheckCircle2, Building, Clock, AlignLeft, Flag, CreditCard, FolderKanban, Trash2, Edit, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { format } from "date-fns"
import { th } from "date-fns/locale"

interface CalendarEvent {
    id: string
    title: string
    start: string
    end?: string
    allDay?: boolean
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    extendedProps: {
        type: "task" | "installment"
        projectId?: string
        projectName?: string
        priority?: string
        status?: string
        assignedTo?: string
        amount?: number
        contractTitle?: string
        workerId?: string
        description?: string
    }
}

interface CalendarEventSheetProps {
    event: CalendarEvent | null
    onClose: () => void
    onEdit?: (task: any) => void
}

export function CalendarEventSheet({ event, onClose, onEdit }: CalendarEventSheetProps) {
    const { t, locale } = useTranslation()
    const { users, workers, deleteTask, updateTask } = useProjects()

    // Local state for immediate UI update
    const [localStatus, setLocalStatus] = React.useState(event?.extendedProps?.status || "Todo")

    // Sync local state when event changes
    React.useEffect(() => {
        if (event) {
            setLocalStatus(event.extendedProps.status || "Todo")
        }
    }, [event])

    if (!event) return null

    // ... (keep existing helper functions)
    const getAssigneeName = (assignedTo?: string) => {
        if (!assignedTo) return locale === "th" ? "ไม่ได้มอบหมาย" : "Unassigned"
        const user = users.find(u => u.id === assignedTo)
        return user?.name || assignedTo
    }

    const getWorkerName = (workerId?: string) => {
        if (!workerId) return "-"
        const worker = workers.find(w => w.id === workerId)
        return worker?.name || workerId
    }

    const isTask = event.extendedProps.type === "task"
    const isInstallment = event.extendedProps.type === "installment"

    const statusColors: Record<string, string> = {
        "Done": "text-green-500 bg-green-500/10",
        "In Progress": "text-blue-500 bg-blue-500/10",
        "Todo": "text-muted-foreground bg-muted",
        "Paid": "text-green-500 bg-green-500/10",
        "Pending": "text-yellow-500 bg-yellow-500/10",
        "Overdue": "text-red-500 bg-red-500/10",
    }

    const statusColorClass = statusColors[event.extendedProps.status || ""] || "text-muted-foreground bg-muted"

    const handleDelete = async () => {
        if (!isTask || !event.extendedProps.projectId) return

        const taskId = event.id.replace("task-", "")
        if (confirm("Are you sure you want to delete this task?")) {
            deleteTask(event.extendedProps.projectId, taskId)
            onClose()
        }
    }

    const handleEdit = () => {
        if (!isTask || !onEdit || !event.extendedProps.projectId) return

        // Construct a partial task object to pass back
        const taskId = event.id.replace("task-", "")
        const taskObj = {
            id: taskId,
            projectId: event.extendedProps.projectId,
            title: event.title,
            status: event.extendedProps.status,
            priority: event.extendedProps.priority,
            assignedTo: event.extendedProps.assignedTo,
            dueDate: event.start ? new Date(event.start).toISOString().split('T')[0] : "",
            // Note: Description might be missing from event extendedProps if not passed initially.
            // If essential, we should fetch the full task or pass description in CalendarView events. 
            // For now, let's assume simple edit or we might lose description if it wasn't in props?
            // BETTER: CalendarView passes full props OR we just rely on what we have. 
            // Ideally, we should fetch from context using ID.
        }
        onEdit(taskObj)
    }

    return (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md h-full bg-card/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-3 rounded-xl border",
                            isTask ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                            {isTask ? <CheckCircle2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">
                                {isTask ? (t.common?.tasks || "งาน") : (t.calendar?.payment || "งวดจ่าย")}
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">ID: {event.id.replace(/^(task-|installment-)/, "")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isTask && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="p-2 rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                    title="Edit Task"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <div className="w-px h-6 bg-border mx-1" />
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-background/50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Hero Card */}
                    <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-background/50 to-muted/20 text-center space-y-2 relative overflow-hidden">
                        <h3 className="text-lg font-bold text-foreground leading-tight px-4 break-words">
                            {event.title.replace(/^(📋|💰)\s*/, "")}
                        </h3>

                        <div className="py-4">
                            {isInstallment ? (
                                <h1 className="text-5xl font-black text-primary tracking-tight">
                                    ฿{event.extendedProps.amount?.toLocaleString() || 0}
                                </h1>
                            ) : (
                                <div className="text-xl font-medium text-muted-foreground bg-muted/30 py-2 px-4 rounded-lg inline-block">
                                    {event.extendedProps.projectName || "-"}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {event.start
                                    ? format(new Date(event.start), "d MMMM yyyy", { locale: locale === "th" ? th : undefined })
                                    : "-"}
                            </span>
                        </div>
                    </div>

                    {/* Status Pill / Dropdown */}
                    <div className="glass-card p-1 rounded-xl border border-white/5 bg-muted/20 flex flex-col">
                        {isTask && event.extendedProps.projectId ? (
                            <div className="relative">
                                <select
                                    value={localStatus}
                                    onChange={(e) => {
                                        const newStatus = e.target.value
                                        setLocalStatus(newStatus) // Update UI immediately
                                        const taskId = event.id.replace("task-", "")
                                        if (event.extendedProps.projectId) {
                                            updateTask(event.extendedProps.projectId, taskId, { status: newStatus as any })
                                        }
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-center appearance-none cursor-pointer outline-none transition-all",
                                        statusColors[localStatus] || "text-muted-foreground bg-muted"
                                    )}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
                            </div>
                        ) : (
                            <div className={cn("px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all", statusColorClass)}>
                                {event.extendedProps.status === 'Paid' && <CheckCircle2 className="w-4 h-4" />}
                                {event.extendedProps.status || "Unknown"}
                            </div>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-3">
                        {/* Project Info */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-500">
                                    <FolderKanban className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{t.common?.projects || "โครงการ"}</p>
                                    <p className="font-medium truncate max-w-[200px]">{event.extendedProps.projectName || "General"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Assignee / Worker */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-pink-500/10 text-pink-500">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                        {isTask ? (t.tasks?.dialog?.assignee || "ผู้รับผิดชอบ") : (t.contracts?.dialog?.worker || "คนงาน")}
                                    </p>
                                    <p className="font-medium">
                                        {isTask
                                            ? getAssigneeName(event.extendedProps.assignedTo)
                                            : getWorkerName(event.extendedProps.workerId)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Task Specifics */}
                        {isTask && (
                            <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                                        <Flag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Priority</p>
                                        <p className={cn("font-medium",
                                            event.extendedProps.priority === "High" ? "text-red-500" :
                                                event.extendedProps.priority === "Medium" ? "text-orange-500" : "text-green-500"
                                        )}>
                                            {event.extendedProps.priority || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Installment Specifics */}
                        {isInstallment && (
                            <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-teal-500/10 text-teal-500">
                                        <AlignLeft className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Description</p>
                                        <p className="font-medium">{event.title.replace(/^(💰)\s*/, "")}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
