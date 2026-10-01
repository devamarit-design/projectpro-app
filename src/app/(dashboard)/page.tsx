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

const CashFlowChart = dynamic(() => import("@/components/dashboard/cash-flow-chart").then(mod => mod.CashFlowChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const ProjectFinancialsChart = dynamic(() => import("@/components/dashboard/project-financials-chart").then(mod => mod.ProjectFinancialsChart), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})



function AdminDashboard() {
  const { t } = useTranslation()
  const [showReportDialog, setShowReportDialog] = useState(false)

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Banner Carousel */}
      <DashboardBanner />

      {/* 1.5. Notice Ticker */}
      <NoticeTicker />

      {/* 2. Hero Section (Real Weather & Financial/Team Bento Grid) */}
      <DashboardHeader onDownload={() => setShowReportDialog(true)} />

      {/* 3. Quick Actions Grid (Icons) */}
      <QuickActionsGrid />



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
            {t.dashboard.team_wall || "Team Wall"}
          </h3>
          <Link href="/wall" className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium">
            {t.dashboard.view_all || "View All"}
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

      {/* 6. Financial & Projects Analytics Overview */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="font-semibold text-xl flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
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
                  <line x1="12" x2="12" y1="20" y2="10" />
                  <line x1="18" x2="18" y1="20" y2="4" />
                  <line x1="6" x2="6" y1="20" y2="16" />
                </svg>
              </div>
              ภาพรวมการเงินและโครงการ (Financial & Projects)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              วิเคราะห์กระแสเงินสดและผลประกอบการเปรียบเทียบแต่ละโครงการ
            </p>
          </div>
          <Link
            href="/financial"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-xl transition-all self-start sm:self-auto"
          >
            ดูการวิเคราะห์เชิงลึกแยกตามโครงการ &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
            <div className="relative z-10">
              <CashFlowChart />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
            <div className="relative z-10">
              <ProjectFinancialsChart />
            </div>
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
  const { currentUser, currentTeam } = useProjects()
  const isAdmin = currentTeam?.role === 'Owner' || currentTeam?.role === 'Admin'

  return isAdmin ? <AdminDashboard /> : <UserDashboard />
}
