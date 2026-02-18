"use client"

import { useState, useMemo, useCallback } from "react"
import { useProjects, WorkItem } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Calendar, LayoutGrid, List } from "lucide-react"
import { ProjectGantt } from "@/components/projects/project-gantt"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AddWorkDialog } from "@/components/modals/add-work-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SchedulePage() {
    const { projects, works, updateWork, updateWorkOrder } = useProjects()
    const { t } = useTranslation()
    const [view, setView] = useState<'gantt' | 'list'>('gantt')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingWork, setEditingWork] = useState<WorkItem | null>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")

    // Flatten all works from all projects using the top-level works state
    const allWorks = useMemo(() => {
        return works.map(w => {
            const project = projects.find(p => p.id === w.projectId)
            return {
                ...w,
                projectName: project?.name || "Unknown Project"
            }
        })
    }, [projects, works])

    const filteredWorks = useMemo(() => {
        if (selectedProjectId === "all") return allWorks
        return allWorks.filter(w => w.projectId === selectedProjectId)
    }, [allWorks, selectedProjectId])

    const handleWorkUpdate = useCallback(async (workId: string, updates: any) => {
        const work = works.find(w => w.id === workId)
        if (work) {
            await updateWork(work.projectId, workId, updates)
        }
    }, [works, updateWork])

    const handleReorder = useCallback(async (newWorks: WorkItem[]) => {
        const updates = newWorks.map((w, index) => ({
            id: w.id,
            sortOrder: index
        }))
        await updateWorkOrder(updates)
    }, [updateWorkOrder])

    const handleAddWork = useCallback(() => {
        setEditingWork(null)
        setIsAddModalOpen(true)
    }, [])

    const handleWorkClick = useCallback((workId: string) => {
        const work = allWorks.find(w => w.id === workId)
        if (work) {
            setEditingWork(work)
            setIsAddModalOpen(true)
        }
    }, [allWorks])

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-700 dark:to-slate-900 text-white shadow-lg shadow-black/10">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.schedule?.title || "แผนงานรวม"}</h1>
                            <p className="text-sm text-muted-foreground">{t.schedule?.subtitle || "ดูภาพรวมงานทั้งหมดในองค์กรแบบ Timeline"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border self-stretch sm:self-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('gantt')}
                            className={cn(
                                "rounded-lg text-[11px] font-black uppercase tracking-widest h-8 px-4",
                                view === 'gantt' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.schedule?.timeline || "Timeline"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('list')}
                            className={cn(
                                "rounded-lg text-[11px] font-black uppercase tracking-widest h-8 px-4",
                                view === 'list' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.schedule?.list_view || "List View"}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[280px] bg-background border-input">
                            <span className="truncate">
                                {selectedProjectId === "all"
                                    ? (t.schedule?.check_all || "Check All Projects")
                                    : projects.find(p => p.id === selectedProjectId)?.name || (t.schedule?.select_project || "Select Project")}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.schedule?.check_all || "Check All Projects"}</SelectItem>
                            {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
                {view === 'gantt' ? (
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ProjectGantt
                            projectId={selectedProjectId}
                            works={filteredWorks}
                            onWorkUpdate={handleWorkUpdate}
                            onWorkClick={handleWorkClick}
                            onAddWork={handleAddWork}
                            onReorder={handleReorder}
                        />
                    </div>
                ) : (
                    <div className="flex-1 bg-background rounded-2xl border border-border overflow-hidden flex flex-col">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">{t.schedule?.table?.task || "Task Name"}</th>
                                        <th className="px-6 py-3 font-medium">{t.schedule?.table?.project || "Project"}</th>
                                        <th className="px-6 py-3 font-medium">{t.schedule?.table?.assignees || "Assignees"}</th>
                                        <th className="px-6 py-3 font-medium">{t.schedule?.table?.status || "Status"}</th>
                                        <th className="px-6 py-3 font-medium">{t.schedule?.table?.due || "Due Date"}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t.schedule?.table?.progress || "Progress"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredWorks.map((work) => (
                                        <tr
                                            key={work.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => handleWorkClick(work.id)}
                                        >
                                            <td className="px-6 py-4 font-medium text-foreground">{work.title}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{work.projectName}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2">
                                                    {work.assignedTo && (
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground">
                                                            User
                                                        </div>
                                                    )}
                                                    {!work.assignedTo && (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                    work.progress === 100 ? "bg-green-500/10 text-green-500" :
                                                        work.progress > 0 ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-slate-500/10 text-slate-500"
                                                )}>
                                                    {work.progress === 100 ? 'Completed' : work.progress > 0 ? 'In Progress' : 'To Do'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {work.endDate ? new Date(work.endDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs font-mono">{work.progress || 0}%</span>
                                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500"
                                                            style={{ width: `${work.progress || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredWorks.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                {t.schedule?.table?.no_tasks || "No tasks found for this selection."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <AddWorkDialog
                isOpen={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                initialData={editingWork}
                projectId={editingWork?.projectId}
            />
        </div>
    )
}
