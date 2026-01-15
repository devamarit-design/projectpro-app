"use client"

import * as React from "react"
import { X, Calendar, User, Tag, ChevronDown, CheckCircle2, Layout } from "lucide-react"
import { useProjects, Priority, TaskStatus } from "@/context/project-context"
import { cn } from "@/lib/utils"

interface AddTaskDialogProps {
    isOpen: boolean
    onClose: () => void
    defaultProjectId?: string
}

import { useTranslation } from "@/lib/i18n-context"

export default function AddTaskDialog({ isOpen, onClose, defaultProjectId }: AddTaskDialogProps) {
    const { projects, addTask, users, currentUser } = useProjects()
    const { t } = useTranslation()
    const [title, setTitle] = React.useState("")
    const [selectedProjectId, setSelectedProjectId] = React.useState(defaultProjectId || "")
    const [priority, setPriority] = React.useState<Priority>("Medium")
    const [status, setStatus] = React.useState<TaskStatus>("Todo")
    const [assignedTo, setAssignedTo] = React.useState("")
    const [dueDate, setDueDate] = React.useState("")
    const [description, setDescription] = React.useState("")

    React.useEffect(() => {
        if (defaultProjectId) {
            setSelectedProjectId(defaultProjectId)
        }
    }, [defaultProjectId])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !selectedProjectId) return

        addTask(selectedProjectId, {
            title,
            status,
            priority,
            assignedTo,
            dueDate,
            description
        })

        // Reset and close
        setTitle("")
        setAssignedTo("")
        setDueDate("")
        setDescription("")
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg glass-card border-white/10 rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-primary">{t.tasks.dialog.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{t.tasks.dialog.subtitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted/50 rounded-full transition-all text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.tasks.dialog.task_title}</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder={t.tasks.dialog.title_placeholder}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-base placeholder:text-muted-foreground/50"
                                required
                            />
                        </div>

                        {/* Project Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.tasks.dialog.assign_project}</label>
                            <div className="relative">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-background/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                    required
                                >
                                    <option value="" disabled>{t.tasks.dialog.select_project}</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.tasks.dialog.priority}</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as Priority)}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="High">{t.tasks.priority.high}</option>
                                        <option value="Medium">{t.tasks.priority.medium}</option>
                                        <option value="Low">{t.tasks.priority.low}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.tasks.dialog.due_date}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-background/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.tasks.dialog.assignee}</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full bg-background/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                >
                                    <option value="">{t.tasks.dialog.unassigned}</option>
                                    {currentUser && (
                                        <option value={currentUser.name} className="font-bold text-primary">
                                            Assign to Me ({currentUser.name})
                                        </option>
                                    )}
                                    {users.map(user => (
                                        <option key={user.id} value={user.name}>{user.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all mt-4"
                        >
                            {t.tasks.dialog.create}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
