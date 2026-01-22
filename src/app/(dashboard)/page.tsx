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
import dynamic from "next/dynamic"

const CashFlowChart = dynamic(() => import("@/components/dashboard/cash-flow-chart").then(mod => mod.CashFlowChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const ProjectFinancialsChart = dynamic(() => import("@/components/dashboard/project-financials-chart").then(mod => mod.ProjectFinancialsChart), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

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

      <DownloadReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      {/* 5. Stats Cards - Contained to prevent horizontal scroll */}
      <div className="overflow-hidden">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto py-2 pb-4 scrollbar-hide">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[300px] sm:min-w-0">
            <StatsCards />
          </div>
        </div>
      </div>

      {/* 6. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
          <div className="relative z-10">
            <CashFlowChart />
          </div>
        </div>

        {/* Project Financials - Takes up 1 column */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
          <div className="relative z-10">
            <ProjectFinancialsChart />
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
