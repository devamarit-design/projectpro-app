import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ProjectTask, Priority, TaskStatus } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { User, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface SortableTaskCardProps {
    task: ProjectTask & { projectName?: string }
    status: TaskStatus
    onSelect: (taskId: string) => void
}

export function SortableTaskCard({ task, status, onSelect }: SortableTaskCardProps) {
    const { t } = useTranslation()
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
            onClick={() => onSelect(task.id)}
            className="w-full p-4 rounded-xl border border-white/10 hover:border-primary/50 bg-card/50 backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden mb-3 shadow-sm touch-none"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                    priorityColors[task.priority]
                )}>
                    {task.priority || "Low"}
                </span>
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
    )
}
