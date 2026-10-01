"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProjectThemeConfig, getProjectMonogram } from "@/lib/project-themes"

interface ProjectCoverGraphicProps {
    theme: ProjectThemeConfig
    name?: string
    className?: string
    showWatermark?: boolean
    showMonogram?: boolean
    compact?: boolean
}

/**
 * High-end architectural graphic cover for projects.
 * Replaces realistic photos with high-contrast, easily distinguishable
 * color themes, blueprint CAD grid lines, glowing radial mesh, and architectural iconography.
 */
export function ProjectCoverGraphic({
    theme,
    name = "",
    className,
    showWatermark = true,
    showMonogram = true,
    compact = false
}: ProjectCoverGraphicProps) {
    const Icon = theme.icon
    const monogram = React.useMemo(() => getProjectMonogram(name), [name])

    return (
        <div
            className={cn(
                "relative inset-0 w-full h-full overflow-hidden select-none bg-slate-950",
                className
            )}
            style={{ backgroundColor: theme.bgTint }}
        >
            {/* Deep rich theme gradient background */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
                    theme.gradientClass
                )}
            />

            {/* Radial glow meshes (Top-Right and Bottom-Left) */}
            <div
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-125"
                style={{ backgroundColor: theme.glowColor }}
            />
            <div
                className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-60"
                style={{ backgroundColor: theme.glowColor }}
            />

            {/* Architectural CAD / Blueprint Grid Pattern */}
            <svg
                className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                <defs>
                    <pattern
                        id={`cad-grid-${theme.id}`}
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 24 0 L 0 0 0 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.8"
                            className="text-white"
                        />
                        {/* Blueprint crosshair mark at grid corner */}
                        <path
                            d="M 0 3 L 0 -3 M -3 0 L 3 0"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            className="text-white"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#cad-grid-${theme.id})`} />
                {/* Subtle isometric architectural reference line */}
                <line
                    x1="0"
                    y1="100%"
                    x2="100%"
                    y2="0"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="4 6"
                    className="text-white opacity-40"
                />
            </svg>

            {/* Top Accent Glowing Border */}
            <div
                className="absolute inset-x-0 top-0 h-[2.5px] z-10"
                style={{
                    background: `linear-gradient(90deg, transparent 5%, ${theme.glowColor} 50%, transparent 95%)`
                }}
            />

            {/* Architectural Watermark & Monogram Glyph (Right Side) */}
            {showWatermark && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-300">
                    <Icon className={cn("shrink-0", compact ? "w-14 h-14" : "w-24 h-24", theme.iconColor)} strokeWidth={1.2} />
                    {showMonogram && monogram && (
                        <span
                            className={cn(
                                "font-black tracking-tighter leading-none select-none text-white/40 drop-shadow-sm font-mono",
                                compact ? "text-3xl" : "text-5xl"
                            )}
                        >
                            {monogram}
                        </span>
                    )}
                </div>
            )}

            {/* Bottom Dark Gradient for Text & Metrics readability */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none" />

            {/* Top Scrim for header readability */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />
        </div>
    )
}
