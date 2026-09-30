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
    status: string
}

interface ProjectCardComponentProps {
    project: ProjectCardProps
    columns?: 1 | 2 | 3 // Layout mode
    priority?: boolean // LCP Optimization
}

export function ProjectCard({ project, columns = 1, priority = false }: ProjectCardComponentProps) {
    // Calculate expense progress percentage (expenses / budget)
    const budgetValue = project.budget || 1 // Avoid division by zero
    const expensePercent = Math.min(100, Math.max(0, Math.round((project.expenses / budgetValue) * 100)))

    // Normalize status key
    const normalizedKey = (project.status || "").toLowerCase().replace(/[\s_-]+/g, '')

    // Status color mapping (for dot and badge)
    const statusDotColors: Record<string, string> = {
        active: "bg-blue-500",
        inprogress: "bg-blue-500",
        planning: "bg-purple-500",
        onhold: "bg-amber-500",
        pending: "bg-amber-500",
        completed: "bg-emerald-500",
    }

    const statusBadgeStyles: Record<string, string> = {
        active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        inprogress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        planning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        onhold: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    }

    const statusLabels: Record<string, string> = {
        active: "In Progress",
        inprogress: "In Progress",
        planning: "Planning",
        onhold: "On Hold",
        pending: "On Hold",
        completed: "Completed",
    }

    const dotColor = statusDotColors[normalizedKey] || "bg-blue-500"
    const badgeStyle = statusBadgeStyles[normalizedKey] || "bg-blue-500/20 text-blue-400 border-blue-500/30"
    const label = statusLabels[normalizedKey] || project.status || "In Progress"

    // Determine if we show status as dot only
    const showStatusAsDot = columns === 2 || columns === 3

    // Determine if we show full details (budget/tasks grid) - enabled for all modes
    const showFullDetails = true

    return (
        <Link href={`/projects/detail?id=${project.id}`} className="group block h-full">
            <div className="relative flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md hover:border-border transition-all duration-300">
                {/* Full Background Image with Contrast Overlays */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={project.imageUrl}
                        alt={project.name}
                        fill
                        priority={priority}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Ambient Dark Scrim to prevent eye strain from busy photos */}
                    <div className="absolute inset-0 bg-black/35 dark:bg-black/45" />
                    {/* Top Scrim Gradient for Title Readability */}
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
                    {/* Bottom Scrim Gradient for Metrics and Progress Bar */}
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/85 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className={cn(
                    "relative z-10 flex flex-col h-full justify-between",
                    columns === 3 ? "p-4" : "p-5"
                )}>
                    {/* Top Row */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-2">
                            <h3 className={cn(
                                "font-bold leading-tight drop-shadow-md tracking-tight text-foreground truncate",
                                columns === 3 ? "text-lg" : "text-xl"
                            )}>
                                {project.name}
                            </h3>
                            <p className={cn(
                                "text-foreground/70 flex items-center gap-1.5 font-medium drop-shadow-sm",
                                columns === 3 ? "text-xs" : "text-sm"
                            )}>
                                <User className={cn(columns === 3 ? "w-3 h-3" : "w-3.5 h-3.5")} />
                                <span className="truncate">{project.client}</span>
                            </p>
                        </div>

                        {/* Status: Dot or Badge */}
                        {showStatusAsDot ? (
                            <div
                                className={cn(
                                    "w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20",
                                    dotColor
                                )}
                                title={label}
                            />
                        ) : (
                            <span className={cn(
                                "px-2.5 py-1 backdrop-blur-sm rounded-lg text-[10px] font-bold border uppercase tracking-wider shadow-sm shrink-0",
                                badgeStyle
                            )}>
                                {label}
                            </span>
                        )}
                    </div>

                    {/* Bottom Row */}
                    <div className="mt-auto pt-3 space-y-2">
                        {/* Full Details: Budget & Tasks */}
                        {showFullDetails && (
                            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-foreground/10">
                                <div>
                                    <span className="text-foreground/50 text-[10px] uppercase tracking-wider font-semibold">Budget</span>
                                    <div className={cn(
                                        "font-semibold text-foreground",
                                        columns === 1 ? "text-lg" : "text-base"
                                    )}>
                                        ฿{project.budget.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-foreground/50 text-[10px] uppercase tracking-wider font-semibold">Tasks</span>
                                    <div className={cn(
                                        "font-medium text-foreground flex items-center justify-end gap-1.5",
                                        columns === 1 ? "text-lg" : "text-base"
                                    )}>
                                        <ListChecks className={cn("text-primary", columns === 1 ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                        {project.taskCount}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar (Always shown) */}
                        <div className="space-y-1">
                            {/* Label */}
                            {showFullDetails && (
                                <div className="flex justify-between text-xs font-medium text-foreground/70">
                                    <span>Expenses</span>
                                    <span>฿{project.expenses.toLocaleString()} ({expensePercent}%)</span>
                                </div>
                            )}
                            <div className="w-full bg-foreground/10 rounded-full overflow-hidden backdrop-blur-sm h-1.5">
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
