"use client"

import { MapPin, Calendar, MoreHorizontal, ArrowLeft, Edit, Trash2, Check, ChevronDown } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useProjects, ProjectStatus } from "@/context/project-context"
import { useRouter } from "next/navigation"

interface ProjectHeaderProps {
    project: {
        id: string
        name: string
        customer: string
        location: string
        status: string
        image: string
        progress: number
        startDate: string
        endDate: string
        budget: string
        expenses?: string
    }
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
    const { deleteProject, updateProject } = useProjects()
    const router = useRouter()
    const [showMenu, setShowMenu] = useState(false)
    const [showStatusPicker, setShowStatusPicker] = useState(false)

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this project?")) {
            deleteProject(project.id)
            router.push("/projects")
        }
    }

    const statuses: ProjectStatus[] = ["Planning", "In Progress", "On Hold", "Completed"]

    const handleStatusChange = (status: ProjectStatus) => {
        updateProject(project.id, { status })
        setShowStatusPicker(false)
    }

    // Calculate progress based on Expenses / Budget if both exist
    const budgetValue = parseInt(project.budget.replace(/[^0-9]/g, '')) || 1
    const expensesValue = parseInt((project.expenses || "0").replace(/[^0-9]/g, '')) || 0
    const calculatedProgress = Math.min(Math.round((expensesValue / budgetValue) * 100), 100)

    // Formatting shorthand for budget/expenses (e.g. 8.5M)
    const formatShorthand = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + "M"
        if (val >= 1000) return (val / 1000).toFixed(0) + "K"
        return val.toString()
    }

    return (
        <div className="relative group">
            {/* Cover Image */}
            <div className="min-h-[500px] md:h-[580px] w-full relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 z-10" />

                {/* Top Actions */}
                <div className="absolute top-8 left-8 right-8 z-50 flex justify-between items-start pointer-events-none">
                    <Link href="/projects" className="p-3.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-xl transition-all inline-flex pointer-events-auto shadow-2xl hover:scale-110 active:scale-90 border border-white/10">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>

                    <div className="relative pointer-events-auto">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-3.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-xl transition-all shadow-2xl hover:scale-110 active:scale-90 border border-white/10"
                        >
                            <MoreHorizontal className="w-6 h-6" />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-14 w-56 bg-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <Link
                                        href={`/projects/${project.id}/edit`}
                                        className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors text-sm font-semibold"
                                    >
                                        <Edit className="w-4.5 h-4.5 text-primary" />
                                        Edit Project
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/10 text-red-500 transition-colors text-sm font-semibold text-left border-t border-white/5"
                                    >
                                        <Trash2 className="w-4.5 h-4.5" />
                                        Delete Project
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-1000"
                />

                {/* Project Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 text-white pt-48 bg-gradient-to-t from-black via-black/40 to-transparent">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        <div className="space-y-6 max-w-full lg:max-w-3xl">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-white/90 text-[10px] md:text-sm flex items-center gap-2 font-bold tracking-tight shadow-xl">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {project.startDate} — {project.endDate}
                                </span>

                                {/* Status Picker */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusPicker(!showStatusPicker)}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-[10px] md:text-sm font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl",
                                            project.status === 'In Progress' ? "bg-blue-500/40 border-blue-500/50 text-white" :
                                                project.status === 'Completed' ? "bg-green-500/40 border-green-500/50 text-white" :
                                                    project.status === 'On Hold' ? "bg-yellow-500/40 border-yellow-500/50 text-white" :
                                                        "bg-gray-500/40 border-gray-500/50 text-white"
                                        )}
                                    >
                                        {project.status}
                                        <ChevronDown className="w-4 h-4 opacity-70" />
                                    </button>

                                    {showStatusPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowStatusPicker(false)} />
                                            <div className="absolute left-0 top-full mt-3 w-52 bg-card/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                                {statuses.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleStatusChange(s)}
                                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-xs font-black uppercase tracking-widest text-white/70 hover:text-white"
                                                    >
                                                        {s}
                                                        {project.status === s && <Check className="w-4 h-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="relative space-y-3">
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-sans tracking-tighter leading-[1.1] drop-shadow-2xl">
                                    {project.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-white/70 text-sm md:text-xl font-medium">
                                    <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {project.location}</span>
                                    <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-2 font-black text-white uppercase tracking-widest text-xs md:text-base bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                                        Client: {project.customer}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Cards */}
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 bg-black/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl border-t border-l border-white/20">
                            <div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Cost Paid / Work Value</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl md:text-3xl font-black text-green-400">
                                        {calculatedProgress}
                                        <span className="text-sm ml-0.5">%</span>
                                    </p>
                                    <span className="text-xs font-bold text-white/60">
                                        (฿{formatShorthand(expensesValue)} / ฿{formatShorthand(budgetValue)})
                                    </span>
                                </div>
                                {/* Progress Bar Mini */}
                                <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                                        style={{ width: `${calculatedProgress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="hidden md:block w-px h-12 bg-white/10" />

                            <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Contract Value</p>
                                <p className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">{project.budget}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
