import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useProjects, ProjectTask, Priority, TaskStatus, User as UserType } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { User, Clock, Check } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { format } from "date-fns"

interface SortableTaskCardProps {
    task: ProjectTask & { projectName?: string }
    status: TaskStatus
    onSelect: (taskId: string) => void
    users: UserType[] // Pass users as prop to avoid redundant context lookups in cards
}

export const SortableTaskCard = React.memo(({ task, status, onSelect, users }: SortableTaskCardProps) => {
    const { t } = useTranslation()
    const { toggleTask } = useProjects()

    // Resolve assignee names (supports multi-assign array)
    const assigneeName = React.useMemo(() => {
        if (!task.assignedTo || (Array.isArray(task.assignedTo) && task.assignedTo.length === 0)) {
            return t.tasks.unassigned
        }
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]
        const names = assignees.map((id: string) => {
            const user = users.find((u: UserType) => u.id === id)
            return user ? user.name : id
        })
        if (names.length === 1) return names[0]
        if (names.length === 2) return names.join(", ")
        return `${names[0]} +${names.length - 1}`
    }, [task.assignedTo, users, t])

    const formattedDate = React.useMemo(() => {
        if (!task.dueDate) return t.tasks.no_date
        try {
            return format(new Date(task.dueDate), "d MMM")
        } catch (error) {
            return task.dueDate
        }
    }, [task.dueDate, t.tasks.no_date])

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const priorityColors: Record<Priority, string> = {
        High: "bg-red-500/10 text-red-500 border-red-500/20",
        Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return
                onSelect(task.id)
            }}
            className={cn(
                "w-full p-4 rounded-xl border border-white/10 hover:border-primary/50 bg-card/50 backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden mb-3 shadow-sm touch-none",
                task.isArchived && "opacity-60 grayscale bg-gray-500/5 hover:bg-gray-500/10 border-gray-500/20"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                    priorityColors[task.priority]
                )}>
                    {task.priority || "Low"}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleTask(task.id)
                        }}
                        className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer z-10",
                            task.status === 'Done' ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-primary"
                        )}
                    >
                        {task.status === 'Done' && <Check className="w-3 h-3" />}
                    </button>
                </div>
                {task.projectName && (
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
                    <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">{assigneeName}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                    status === 'Done' ? 'text-green-500' : 'text-orange-500'
                )}>
                    <Clock className="w-3 h-3" />
                    {formattedDate}
                </div>
            </div>
        </div>
    )
})
