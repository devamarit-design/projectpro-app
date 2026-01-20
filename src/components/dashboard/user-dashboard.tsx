"use client"

import * as React from "react"
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { DashboardTasks } from "./dashboard-tasks"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardFiles } from "./dashboard-files"
import { WeatherCard } from "./weather-card"
import { useTranslation } from "@/lib/i18n-context"

interface UserDashboardProps {
    hideHeader?: boolean
}

export function UserDashboard({ hideHeader = false }: UserDashboardProps) {
    const { currentUser, projects, tasks } = useProjects()

    const { t } = useTranslation()

    // Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return t.dashboard.greeting_morning
        if (hour < 18) return t.dashboard.greeting_afternoon
        return t.dashboard.greeting_evening
    }

    return (
        <div className="pb-20 space-y-6 pt-6">
            {!hideHeader && (
                <>
                    <header className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">
                            {getGreeting()}, <span className="text-foreground">{currentUser?.name?.split(' ')[0] || "User"}</span>
                        </h1>
                        <p className="text-muted-foreground">{t.dashboard.personal_overview}</p>
                    </header>

                    {/* Weather Card */}
                    <WeatherCard />

                    {/* Quick Stats */}
                    <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                        <h3 className="font-bold text-lg mb-2">{t.dashboard.quick_stats}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/tasks" className="p-3 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors group cursor-pointer">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold group-hover:text-primary transition-colors">{t.dashboard.pending_tasks}</p>
                                <p className="text-2xl font-black text-primary">
                                    {currentUser ?
                                        tasks.filter(t => (t.assignedTo === currentUser.id || t.assignedTo === currentUser.name) && t.status !== 'Done').length
                                        : 0}
                                </p>
                            </Link>
                            <Link href="/projects" className="p-3 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors group cursor-pointer">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold group-hover:text-blue-500 transition-colors">{t.dashboard.active_projects}</p>
                                <p className="text-2xl font-black text-blue-500">
                                    {projects.filter(p => p.status === 'In Progress').length}
                                </p>
                            </Link>
                        </div>
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Tasks & Activity (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                    <DashboardTasks />
                    {/* Activity Feed */}
                    <div className="col-span-1 lg:col-span-2 h-[500px]">
                        <DashboardActivity limit={12} showViewAll={true} />
                    </div>
                </div>

                {/* Sidebar: Files (1/3 width) */}
                <div className="space-y-6">

                    <DashboardFiles />
                </div>
            </div>
        </div>
    )
}
