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
import { NoticeTicker } from "@/components/dashboard/notice-ticker"
import { WallFeed } from "@/components/wall/wall-feed"
import { MarketOverview } from "@/components/dashboard/market-overview"

export function UserDashboard({ hideHeader = false }: UserDashboardProps) {
    const { currentUser, projects, tasks } = useProjects()

    const { t } = useTranslation()

    return (
        <div className="pb-20 space-y-6 pt-6">
            {!hideHeader && (
                <>
                    {/* 1. Banner Carousel */}
                    <DashboardBanner />

                    {/* 1.5. Notice Ticker */}
                    <NoticeTicker />

                    {/* 2. Quick Actions Grid (Icons) */}
                    <QuickActionsGrid />

                    {/* 2.5. Team Wall Widget (Moved Here) */}
                    <div className="w-full mt-4 mb-6">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-500">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4"
                                    >
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <line x1="3" x2="21" y1="9" y2="9" />
                                        <path d="M9 21V9" />
                                    </svg>
                                </div>
                                {t.dashboard.team_wall || "Team Wall"}
                            </h3>
                            <Link href="/wall" className="text-xs text-muted-foreground hover:text-primary hover:underline font-medium">
                                {t.dashboard.view_all || "View All"}
                            </Link>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-sm">
                            <WallFeed variant="widget" />
                        </div>
                    </div>

                    {/* 3. Promo / Feature Cards */}
                    <PromoCards />

                    {/* 4. Mood-based Header (Welcome) */}
                    <DashboardHeader />

                    {/* 4.5 Market Overview */}
                    <MarketOverview />
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

                {/* Sidebar: Files & Wall (1/3 width) */}
                <div className="space-y-6">
                    <DashboardFiles />


                </div>
            </div>
        </div>
    )
}
