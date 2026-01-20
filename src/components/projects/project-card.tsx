import Link from "next/link"
import Image from "next/image"
import { User, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
    id: string
    name: string
    client: string
    taskCount: number
    budget: number
    expenses: number
    imageUrl: string
    status: "active" | "completed" | "pending"
}

interface ProjectCardComponentProps {
    project: ProjectCardProps
    columns?: 1 | 2 | 3 // Layout mode
}

export function ProjectCard({ project, columns = 1 }: ProjectCardComponentProps) {
    // Calculate expense progress percentage (expenses / budget)
    const budgetValue = project.budget || 1 // Avoid division by zero
    const expensePercent = Math.min(100, Math.max(0, Math.round((project.expenses / budgetValue) * 100)))

    // Status color mapping (for dot and badge)
    const statusDotColors = {
        active: "bg-blue-500",
        completed: "bg-green-500",
        pending: "bg-yellow-500"
    }

    const statusBadgeStyles = {
        active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        completed: "bg-green-500/20 text-green-400 border-green-500/30",
        pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }

    const statusLabels = {
        active: "In Progress",
        completed: "Completed",
        pending: "On Hold"
    }

    // Determine if we show status as dot only
    const showStatusAsDot = columns === 2 || columns === 3

    // Determine if we show full details (budget/tasks grid)
    const showFullDetails = columns === 1 || columns === 2

    return (
        <Link href={`/projects/detail?id=${project.id}`} className="group block h-full">
            <div className="relative flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Full Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={project.imageUrl}
                        alt={project.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Theme-Aware Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className={cn(
                    "relative z-10 flex flex-col h-full justify-between",
                    columns === 3 ? "p-3" : "p-5"
                )}>
                    {/* Top Row */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className={cn(
                                "font-bold leading-tight drop-shadow-md tracking-tight text-foreground",
                                columns === 3 ? "text-base line-clamp-2" : "text-xl"
                            )}>
                                {project.name}
                            </h3>
                            <p className={cn(
                                "text-foreground/70 flex items-center gap-1.5 font-medium drop-shadow-sm",
                                columns === 3 ? "text-xs" : "text-sm"
                            )}>
                                <User className={cn(columns === 3 ? "w-3 h-3" : "w-3.5 h-3.5")} />
                                <span className={cn(columns === 3 && "line-clamp-1")}>{project.client}</span>
                            </p>
                        </div>

                        {/* Status: Dot or Badge */}
                        {showStatusAsDot ? (
                            <div
                                className={cn(
                                    "w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20",
                                    statusDotColors[project.status]
                                )}
                                title={statusLabels[project.status]}
                            />
                        ) : (
                            <span className={cn(
                                "px-2.5 py-1 backdrop-blur-sm rounded-lg text-[10px] font-bold border uppercase tracking-wider shadow-sm shrink-0",
                                statusBadgeStyles[project.status]
                            )}>
                                {statusLabels[project.status]}
                            </span>
                        )}
                    </div>

                    {/* Bottom Row */}
                    <div className="mt-auto pt-3 space-y-2">
                        {/* Full Details: Budget & Tasks (Only for 1 or 2 columns) */}
                        {showFullDetails && (
                            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-foreground/10">
                                <div>
                                    <span className="text-foreground/50 text-[10px] uppercase tracking-wider font-semibold">Budget</span>
                                    <div className={cn(
                                        "font-semibold text-foreground",
                                        columns === 2 ? "text-base" : "text-lg"
                                    )}>
                                        ฿{project.budget.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-foreground/50 text-[10px] uppercase tracking-wider font-semibold">Tasks</span>
                                    <div className={cn(
                                        "font-medium text-foreground flex items-center justify-end gap-1.5",
                                        columns === 2 ? "text-base" : "text-lg"
                                    )}>
                                        <ListChecks className={cn("text-primary", columns === 2 ? "w-3.5 h-3.5" : "w-4 h-4")} />
                                        {project.taskCount}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar (Always shown) */}
                        <div className="space-y-1">
                            {/* Label only for 1-col or 2-col */}
                            {showFullDetails && (
                                <div className="flex justify-between text-xs font-medium text-foreground/70">
                                    <span>Expenses</span>
                                    <span>฿{project.expenses.toLocaleString()} ({expensePercent}%)</span>
                                </div>
                            )}
                            <div className={cn(
                                "w-full bg-foreground/10 rounded-full overflow-hidden backdrop-blur-sm",
                                columns === 3 ? "h-1" : "h-1.5"
                            )}>
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        expensePercent > 90 ? "bg-red-500" : expensePercent > 70 ? "bg-yellow-500" : "bg-primary"
                                    )}
                                    style={{ width: `${expensePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
