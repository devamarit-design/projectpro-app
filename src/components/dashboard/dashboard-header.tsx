"use client"

import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Download, Sun, Moon, Cloud } from "lucide-react"

interface DashboardHeaderProps {
    onDownload: () => void
}

export function DashboardHeader({ onDownload }: DashboardHeaderProps) {
    const { currentUser } = useProjects()
    const { t } = useTranslation()

    // Time based greeting
    const hour = new Date().getHours()
    let greeting = "Good Morning"
    let Icon = Sun
    if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon"
        Icon = Sun
    } else if (hour >= 17) {
        greeting = "Good Evening"
        Icon = Moon
    }

    // Format date
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const pendingTasks = 5 // Mock for visual, or get from real data

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-white/80 mb-1">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{today}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">
                        {greeting}, {currentUser?.name?.split(' ')[0] || 'Amarit'}
                    </h1>
                    <p className="text-white/80 max-w-md text-lg">
                        Here's your personal overview for today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl transition-all font-semibold border border-white/10 shadow-xl hover:scale-105 active:scale-95 group"
                    >
                        <Download className="w-5 h-5 group-hover:animate-bounce" />
                        Download Report
                    </button>
                </div>
            </div>
        </div>
    )
}
