import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskStatus, ProjectTask } from "@/context/project-context"
import { SortableTaskCard } from "@/components/tasks/sortable-task-card"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface TasksColumnProps {
    status: TaskStatus
    title: string
    tasks: ProjectTask[]
    statusColor: string
    onAddTask: () => void
    onSelectTask: (id: string) => void
    t: any
}

export function TasksColumn({ status, title, tasks, statusColor, onAddTask, onSelectTask, t }: TasksColumnProps) {
    const { setNodeRef } = useDroppable({
        id: status,
    })

    return (
        <div
            ref={setNodeRef}
            className="flex-1 flex flex-col h-full bg-muted/30 dark:bg-muted/10 rounded-2xl border border-white/10 overflow-hidden transition-colors hover:bg-muted/40"
        >
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-muted/20 backdrop-blur-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shadow-lg ring-2 ring-opacity-20", statusColor.replace('bg-', 'ring-'))} style={{ backgroundColor: 'currentColor' }} />
                    <span className={cn(status === 'Todo' ? 'text-slate-500' : status === 'In Progress' ? 'text-blue-500' : 'text-green-500')}>
                        {title}
                    </span>
                    <span className="ml-1 text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-white/5 font-medium">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            status={status}
                            onSelect={onSelectTask}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-24 rounded-xl border-2 border-dashed border-muted flex items-center justify-center p-4 text-center opacity-50 hover:opacity-100 transition-opacity">
                        <p className="text-xs text-muted-foreground font-medium">{t.tasks.empty}</p>
                    </div>
                )}

                <button
                    onClick={onAddTask}
                    className="w-full py-3 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-xs font-bold uppercase tracking-widest text-primary/70 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 group mt-2"
                >
                    <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                    {t.tasks.add_task}
                </button>
            </div>
        </div>
    )
}
