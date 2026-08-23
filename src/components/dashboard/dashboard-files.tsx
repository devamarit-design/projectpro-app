"use client"

import * as React from "react"
import { useProjects, ProjectFile } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { FileText, Image as ImageIcon, FileSpreadsheet, Film, File, Folder, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

export function DashboardFiles() {
    const { files, projects } = useProjects()
    const [projectFilter, setProjectFilter] = React.useState<string>("all")

    const recentFiles = React.useMemo(() => {
        let filtered = files

        if (projectFilter !== "all") {
            filtered = filtered.filter(f => f.projectId === projectFilter)
        }

        // Mock Sort by Date (Use uploadedAt string, ideally needs parsing but good enough for mock '10 Jan 2024')
        // We'll just take the top ones as they come in reverse (assuming new added to top) or string sort
        return filtered.slice(0, 4)
    }, [files, projectFilter])

    const getIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />
            case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-green-500" />
            case 'video': return <Film className="w-5 h-5 text-purple-500" />
            default: return <File className="w-5 h-5 text-slate-500" />
        }
    }

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/5 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    Recent Files
                </h3>
            </div>

            {/* Simple Project Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 mb-4 scrollbar-hide">
                <button
                    onClick={() => setProjectFilter("all")}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                        projectFilter === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 border-white/5 hover:bg-muted/50"
                    )}
                >
                    All
                </button>
                {projects.slice(0, 3).map(p => (
                    <button
                        key={p.id}
                        onClick={() => setProjectFilter(p.id)}
                        className={cn("px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                            projectFilter === p.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/30 border-white/5 hover:bg-muted/50"
                        )}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {recentFiles.length > 0 ? (
                    recentFiles.map(file => {
                        const project = projects.find(p => p.id === file.projectId)
                        return (
                            <div key={file.id} className="group flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-white/5 transition-colors cursor-pointer">
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                    {getIcon(file.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{project?.name || "Unknown Project"}</p>
                                </div>
                                <button className="p-2 rounded-full hover:bg-background text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-6 text-muted-foreground opacity-60">
                        <p className="text-xs">No files found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
