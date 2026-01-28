"use client"

import { useState, useMemo } from "react"
import { useProjects, WorkItem } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Calendar, LayoutGrid, List } from "lucide-react"
import { ProjectGantt } from "@/components/projects/project-gantt"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AddWorkDialog } from "@/components/modals/add-work-dialog"

export default function SchedulePage() {
    const { projects, works, updateWork, updateWorkOrder } = useProjects()
    const { t } = useTranslation()
    const [view, setView] = useState<'gantt' | 'list'>('gantt')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingWork, setEditingWork] = useState<WorkItem | null>(null)

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

    const handleWorkUpdate = async (workId: string, updates: any) => {
        const work = works.find(w => w.id === workId)
        if (work) {
            await updateWork(work.projectId, workId, updates)
        }
    }

    const handleReorder = async (newWorks: WorkItem[]) => {
        const updates = newWorks.map((w, index) => ({
            id: w.id,
            sortOrder: index
        }))
        await updateWorkOrder(updates)
    }

    const handleAddWork = () => {
        setEditingWork(null)
        setIsAddModalOpen(true)
    }

    const handleWorkClick = (workId: string) => {
        const work = allWorks.find(w => w.id === workId)
        if (work) {
            setEditingWork(work)
            setIsAddModalOpen(true)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#020617]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-lg shadow-black/20">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">{t.schedule?.title || "แผนงานรวม"}</h1>
                        <p className="text-sm text-white/40">{t.schedule?.subtitle || "ดูภาพรวมงานทั้งหมดในองค์กรแบบ Timeline"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView('gantt')}
                        className={cn(
                            "rounded-lg text-[11px] font-black uppercase tracking-widest h-8 px-4",
                            view === 'gantt' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        Timeline
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView('list')}
                        className={cn(
                            "rounded-lg text-[11px] font-black uppercase tracking-widest h-8 px-4",
                            view === 'list' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        List View
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-hidden">
                {view === 'gantt' ? (
                    <ProjectGantt
                        projectId="all"
                        works={allWorks}
                        onWorkUpdate={handleWorkUpdate}
                        onWorkClick={handleWorkClick}
                        onAddWork={handleAddWork}
                        onReorder={handleReorder}
                    />
                ) : (
                    <div className="bg-slate-900 rounded-[32px] border border-white/5 p-8 flex flex-col items-center justify-center h-[500px]">
                        <List className="w-12 h-12 text-white/5 mb-4" />
                        <p className="text-white/20 font-medium">List view is coming soon...</p>
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
