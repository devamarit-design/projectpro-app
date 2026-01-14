"use client"

import * as React from "react"
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { DashboardTasks } from "./dashboard-tasks"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardFiles } from "./dashboard-files"

export function UserDashboard() {
    const { currentUser } = useProjects()

    // Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 18) return "Good Afternoon"
        return "Good Evening"
    }

    return (
        <div className="pb-20 space-y-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">
                    {getGreeting()}, <span className="text-foreground">{currentUser?.name?.split(' ')[0] || "User"}</span>
                </h1>
                <p className="text-muted-foreground">Here's your personal overview for today.</p>
            </header>

            {/* Quick Stats */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                <h3 className="font-bold text-lg mb-2">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/tasks" className="p-3 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors group cursor-pointer">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold group-hover:text-primary transition-colors">Pending Tasks</p>
                        <p className="text-2xl font-black text-primary">3</p>
                    </Link>
                    <Link href="/projects" className="p-3 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors group cursor-pointer">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold group-hover:text-green-500 transition-colors">This Week</p>
                        <p className="text-2xl font-black text-green-500">12h</p>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Tasks & Activity (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                    <DashboardTasks />
                    <DashboardActivity />
                </div>

                {/* Sidebar: Files (1/3 width) */}
                <div className="space-y-6">

                    <DashboardFiles />
                </div>
            </div>
        </div>
    )
}
