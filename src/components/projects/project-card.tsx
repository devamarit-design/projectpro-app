"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { User, ListChecks, MapPin, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjectRealtimeWeather } from "@/lib/project-weather"
import { getSmartProjectCover } from "@/lib/project-covers"
import { isCustomUploadedPhoto, getProjectTheme } from "@/lib/project-themes"
import { ProjectCoverGraphic } from "@/components/projects/project-cover-graphic"
import { CoverPresetModal } from "@/components/projects/cover-preset-picker"
import { useProjects } from "@/context/project-context"
import { useOrganization } from "@/context/organization-context"
import { uploadImage } from "@/lib/upload"
import { toast } from "sonner"

interface ProjectCardProps {
    id: string
    name: string
    client: string
    taskCount: number
    budget: number
    expenses: number
    imageUrl: string
    status: string
    location?: string
    mapUrl?: string
}

interface ProjectCardComponentProps {
    project: ProjectCardProps
    columns?: 1 | 2 | 3 // Layout mode
    priority?: boolean // LCP Optimization
}

export function ProjectCard({ project, columns = 1, priority = false }: ProjectCardComponentProps) {
    const [showCoverModal, setShowCoverModal] = React.useState(false)
    const { updateProject } = useProjects()
    const { currentOrg } = useOrganization()

    // Distinguish between genuine user-uploaded photos vs graphic color themes
    const hasCustomPhoto = React.useMemo(() => {
        return isCustomUploadedPhoto(project.imageUrl)
    }, [project.imageUrl])

    // Architectural color & icon theme
    const theme = React.useMemo(() => {
        return getProjectTheme({
            id: project.id,
            name: project.name,
            imageUrl: project.imageUrl
        })
    }, [project.id, project.name, project.imageUrl])

    // Fallback photo URL if custom photo is present
    const coverUrl = React.useMemo(() => {
        if (hasCustomPhoto) return project.imageUrl
        return getSmartProjectCover({
            id: project.id,
            name: project.name,
            imageUrl: project.imageUrl
        })
    }, [hasCustomPhoto, project.id, project.name, project.imageUrl])

    const handleSelectCover = async (newUrl: string) => {
        try {
            await updateProject(project.id, { image: newUrl })
            toast.success("เปลี่ยนรูปแบบโครงการสำเร็จ")
        } catch (e) {
            console.error("Failed to update project cover", e)
            toast.error("ไม่สามารถบันทึกได้")
        }
    }

    const handleUploadCustomFile = async (file: File) => {
        if (!currentOrg?.id) throw new Error("No organization selected")
        return await uploadImage(file, `organizations/${currentOrg.id}/projects/covers`)
    }

    // Real-time project weather & map coordinates
    const { weather, mapsUrl } = useProjectRealtimeWeather({
        location: project.location,
        mapUrl: project.mapUrl,
        name: project.name,
    })

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

    const ThemeIcon = theme.icon

    return (
        <>
            <Link href={`/projects/detail?id=${project.id}`} className="group block h-full">
                <div className={cn(
                    "relative flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300",
                    hasCustomPhoto ? "border-border/50 hover:border-border" : theme.borderColor
                )}>
                    {/* Background: Either Genuine Custom Photo OR Clean Graphic Color CAD Theme */}
                    <div className="absolute inset-0 z-0">
                        {hasCustomPhoto ? (
                            <>
                                <Image
                                    src={coverUrl}
                                    alt={project.name}
                                    fill
                                    priority={priority}
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                {/* Ambient Dark Scrim to prevent eye strain */}
                                <div className="absolute inset-0 bg-black/35 dark:bg-black/45" />
                                {/* Top Scrim Gradient for Title Readability */}
                                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
                                {/* Bottom Scrim Gradient for Metrics and Progress Bar */}
                                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/85 to-transparent" />
                            </>
                        ) : (
                            <ProjectCoverGraphic
                                theme={theme}
                                name={project.name}
                                compact={columns > 1}
                            />
                        )}
                    </div>

                    {/* Content Overlay */}
                    <div className={cn(
                        "relative z-10 flex flex-col h-full justify-between",
                        columns === 1 ? "p-4 sm:p-5" : "p-3 sm:p-4"
                    )}>
                        {/* Top Area */}
                        {columns === 1 ? (
                            /* 1 Column Layout: Wide card */
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border backdrop-blur-sm shadow-xs shrink-0",
                                            theme.badgeBg
                                        )}>
                                            <ThemeIcon className={cn("w-3 h-3 shrink-0", theme.iconColor)} />
                                            <span>{theme.categoryLabel}</span>
                                        </span>
                                        {project.client && (
                                            <p 
                                                className="text-white/80 dark:text-foreground/70 flex items-center gap-1 font-medium drop-shadow-sm text-xs sm:text-sm"
                                                title={project.client}
                                            >
                                                <User className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate max-w-[200px]">{project.client}</span>
                                            </p>
                                        )}
                                    </div>
                                    <h3 
                                        className="font-bold leading-snug drop-shadow-md tracking-tight text-white dark:text-foreground text-lg sm:text-xl line-clamp-2"
                                        title={project.name}
                                    >
                                        {project.name}
                                    </h3>
                                </div>

                                {/* Right Controls */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Quick Cover Edit Button (subtle on hover) */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setShowCoverModal(true)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-md text-[10px] sm:text-xs font-medium shadow-sm transition-all duration-200 active:scale-95 shrink-0"
                                        title="เปลี่ยนรูปหน้าปกโครงการ"
                                    >
                                        <Camera className="w-3 h-3 text-primary" />
                                        <span className="hidden sm:inline">เปลี่ยนปก</span>
                                    </button>
                                    {weather && (() => {
                                        const WeatherIcon = weather.icon
                                        return (
                                            <div
                                                onClick={(e) => {
                                                    if (mapsUrl) {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        window.open(mapsUrl, "_blank", "noopener,noreferrer")
                                                    }
                                                }}
                                                role={mapsUrl ? "button" : undefined}
                                                tabIndex={mapsUrl ? 0 : undefined}
                                                className={cn(
                                                    "group/weather flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full",
                                                    "bg-black/50 dark:bg-black/60 hover:bg-black/75 backdrop-blur-md",
                                                    "border border-white/20 text-white shadow-sm transition-all duration-200",
                                                    mapsUrl ? "cursor-pointer hover:scale-105 active:scale-95 hover:border-white/40" : "cursor-default"
                                                )}
                                                title={`สภาพอากาศ Real-time: ${weather.label} ${weather.temperature}°C (${weather.locationName})${mapsUrl ? " • คลิกเพื่อเปิดพิกัดแผนที่ (Google Maps)" : ""}`}
                                            >
                                                <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                </span>
                                                <WeatherIcon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0", weather.iconColor)} />
                                                <span className="text-[11px] sm:text-xs font-bold tabular-nums text-white drop-shadow-sm">
                                                    {weather.temperature}°
                                                </span>
                                                <span className="hidden sm:inline-block text-[10px] text-white/80 font-medium truncate max-w-[120px] border-l border-white/20 pl-1.5">
                                                    {weather.locationName}
                                                </span>
                                                {mapsUrl && (
                                                    <MapPin className="w-2.5 h-2.5 text-rose-400/90 group-hover/weather:text-rose-300 transition-colors shrink-0" />
                                                )}
                                            </div>
                                        )
                                    })()}
                                    <span className={cn(
                                        "px-2 sm:px-2.5 py-0.5 sm:py-1 backdrop-blur-sm rounded-lg text-[9px] sm:text-[10px] font-bold border uppercase tracking-wider shadow-sm shrink-0",
                                        badgeStyle
                                    )}>
                                        {label}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* 2 or 3 Columns Layout (Mobile Grid): Title gets 100% full width so Thai project name is never truncated */
                            <div className="flex flex-col gap-1.5 w-full">
                                {/* Top Utility Bar: Category on Left, Weather & Status Dot on Right */}
                                <div className="flex items-center justify-between gap-1 w-full">
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-sm shadow-xs shrink-0 max-w-[45%]",
                                        theme.badgeBg
                                    )}>
                                        <ThemeIcon className={cn("w-2.5 h-2.5 shrink-0", theme.iconColor)} />
                                        <span className="truncate">{theme.categoryLabel}</span>
                                    </span>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {weather && (() => {
                                            const WeatherIcon = weather.icon
                                            return (
                                                <div
                                                    onClick={(e) => {
                                                        if (mapsUrl) {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            window.open(mapsUrl, "_blank", "noopener,noreferrer")
                                                        }
                                                    }}
                                                    role={mapsUrl ? "button" : undefined}
                                                    tabIndex={mapsUrl ? 0 : undefined}
                                                    className={cn(
                                                        "group/weather flex items-center gap-1 px-1.5 py-0.5 rounded-full",
                                                        "bg-black/50 dark:bg-black/60 hover:bg-black/75 backdrop-blur-md",
                                                        "border border-white/20 text-white shadow-sm transition-all duration-200",
                                                        mapsUrl ? "cursor-pointer active:scale-95 hover:border-white/40" : "cursor-default"
                                                    )}
                                                    title={`สภาพอากาศ Real-time: ${weather.label} ${weather.temperature}°C (${weather.locationName})${mapsUrl ? " • คลิกเพื่อเปิดพิกัดแผนที่ (Google Maps)" : ""}`}
                                                >
                                                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                    </span>
                                                    <WeatherIcon className={cn("w-2.5 h-2.5 shrink-0", weather.iconColor)} />
                                                    <span className="text-[10px] font-bold tabular-nums text-white drop-shadow-sm">
                                                        {weather.temperature}°
                                                    </span>
                                                    {mapsUrl && (
                                                        <MapPin className="w-2 h-2 text-rose-400/90 shrink-0" />
                                                    )}
                                                </div>
                                            )
                                        })()}

                                        {showStatusAsDot ? (
                                            <div
                                                className={cn(
                                                    "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white/20",
                                                    dotColor
                                                )}
                                                title={label}
                                            />
                                        ) : (
                                            <span className={cn(
                                                "px-1.5 py-0.5 backdrop-blur-sm rounded text-[9px] font-bold border uppercase tracking-wider shadow-sm shrink-0",
                                                badgeStyle
                                            )}>
                                                {label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Project Title (FULL 100% WIDTH OF CARD - no longer squeezed!) */}
                                <div className="space-y-0.5 pt-0.5">
                                    <h3 
                                        className="font-bold leading-snug drop-shadow-md tracking-tight text-white dark:text-foreground text-sm sm:text-base line-clamp-2"
                                        title={project.name}
                                    >
                                        {project.name}
                                    </h3>

                                    {project.client && (
                                        <p 
                                            className="text-white/80 dark:text-foreground/70 flex items-center gap-1 font-medium drop-shadow-sm text-[11px] sm:text-xs"
                                            title={project.client}
                                        >
                                            <User className="w-3 h-3 shrink-0" />
                                            <span className="truncate max-w-[140px] sm:max-w-[170px]">{project.client}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bottom Row */}
                        <div className="mt-auto pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
                            {/* Full Details: Budget & Tasks */}
                            {showFullDetails && (
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-4 pb-1.5 sm:pb-2 border-b border-foreground/10">
                                    <div>
                                        <span className="text-foreground/50 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold block truncate">Budget</span>
                                        <div className={cn(
                                            "font-semibold text-foreground truncate",
                                            columns === 1 ? "text-base sm:text-lg" : "text-xs sm:text-base"
                                        )}>
                                            ฿{project.budget.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-foreground/50 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold block truncate">Tasks</span>
                                        <div className={cn(
                                            "font-medium text-foreground flex items-center justify-end gap-1",
                                            columns === 1 ? "text-base sm:text-lg" : "text-xs sm:text-base"
                                        )}>
                                            <ListChecks className={cn("text-primary shrink-0", columns === 1 ? "w-4 h-4" : "w-3 h-3 sm:w-3.5 sm:h-3.5")} />
                                            <span>{project.taskCount}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar (Always shown) */}
                            <div className="space-y-1">
                                {/* Label */}
                                {showFullDetails && (
                                    <div className="flex justify-between text-[10px] sm:text-xs font-medium text-foreground/70">
                                        <span>Expenses</span>
                                        <span className="truncate">฿{project.expenses.toLocaleString()} ({expensePercent}%)</span>
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

            {/* Quick Cover Preset Modal */}
            <CoverPresetModal
                isOpen={showCoverModal}
                onClose={() => setShowCoverModal(false)}
                currentImageUrl={coverUrl}
                projectName={project.name}
                projectId={project.id}
                onSelectCover={handleSelectCover}
                onUploadCustomFile={handleUploadCustomFile}
            />
        </>
    )
}
