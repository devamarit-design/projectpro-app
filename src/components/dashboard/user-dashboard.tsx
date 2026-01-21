"use client"

import * as React from "react"
import Link from "next/link"
import { useProjects } from "@/context/project-context"
import { DashboardTasks } from "./dashboard-tasks"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardFiles } from "./dashboard-files"
import { WeatherCard } from "./weather-card"
import { DashboardHeader } from "./dashboard-header"
import { useTranslation } from "@/lib/i18n-context"

interface UserDashboardProps {
    hideHeader?: boolean
}

import { DashboardBanner } from "@/components/dashboard/dashboard-banner"
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid"
import { PromoCards } from "@/components/dashboard/promo-cards"

export function UserDashboard({ hideHeader = false }: UserDashboardProps) {
    const { currentUser, projects, tasks } = useProjects()

    const { t } = useTranslation()

    return (
        <div className="pb-20 space-y-6 pt-6">
            {!hideHeader && (
                <>
                    {/* 1. Banner Carousel */}
                    <DashboardBanner />

                    {/* 2. Quick Actions Grid (Icons) */}
                    <QuickActionsGrid />

                    {/* 3. Promo / Feature Cards */}
                    <PromoCards />

                    {/* 4. Mood-based Header (Welcome) */}
                    <DashboardHeader />
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
