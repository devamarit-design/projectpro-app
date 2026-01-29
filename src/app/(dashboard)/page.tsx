"use client"

import { useProjects } from "@/context/project-context"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { useTranslation } from "@/lib/i18n-context"
import { DownloadReportDialog } from "@/components/dashboard/download-report-dialog"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardBanner } from "@/components/dashboard/dashboard-banner"
import { NoticeTicker } from "@/components/dashboard/notice-ticker"
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid"
import { PromoCards } from "@/components/dashboard/promo-cards"
import { useState } from "react"
import { WallFeed } from "@/components/wall/wall-feed"
import Link from "next/link"

import dynamic from "next/dynamic"



function AdminDashboard() {
  const { t } = useTranslation()
  const [showReportDialog, setShowReportDialog] = useState(false)

  return (
    <div className="space-y-6 pb-20 pt-6">
      {/* 1. Banner Carousel */}
      <DashboardBanner />

      {/* 1.5. Notice Ticker */}
      <NoticeTicker />

      {/* 2. Quick Actions Grid (Icons) */}
      <QuickActionsGrid />

      {/* 3. Promo / Feature Cards */}
      <PromoCards />

      {/* 4. Header Section (Mood Card) */}
      <DashboardHeader onDownload={() => setShowReportDialog(true)} />



      {/* 5. Team Wall Widget (Admin View) */}
      <div className="w-full mt-6 mb-8">
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="font-semibold text-xl flex items-center gap-2">
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
            Team Wall
          </h3>
          <Link href="/wall" className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium">
            View All
          </Link>
        </div>
        <div className="bg-muted/30 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-border/50 dark:border-white/10 shadow-sm">
          <WallFeed variant="widget" />
        </div>
      </div>

      <DownloadReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      {/* 5. Stats Cards - Contained to prevent horizontal scroll */}
      <div className="overflow-hidden">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto py-2 pb-4 scrollbar-hide">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[300px] sm:min-w-0">
            <StatsCards />
          </div>
        </div>
      </div>



      {/* 7. Personal Work Section */}
      <div className="pt-8 border-t border-white/5">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          {t.dashboard.my_work}
          <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full border border-white/5">{t.dashboard.personal}</span>
        </h2>
        <UserDashboard hideHeader={true} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { currentUser } = useProjects()
  const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

  return isAdmin ? <AdminDashboard /> : <UserDashboard />
}
