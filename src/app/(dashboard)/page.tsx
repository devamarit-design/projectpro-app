"use client"

import { useProjects } from "@/context/project-context"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { useTranslation } from "@/lib/i18n-context"
import { DownloadReportDialog } from "@/components/dashboard/download-report-dialog"
import { useState } from "react"
// import { cn } from "@/lib/utils"

function AdminDashboard() {
  const { t } = useTranslation()
  const [showReportDialog, setShowReportDialog] = useState(false)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary font-sans">{t.common.dashboard}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReportDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {/* You could add an icon here like <Download className="w-4 h-4" /> */}
            {t.dashboard.download_report}
          </button>
        </div>
      </div>

      <DownloadReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      {/* Stats Cards - Horizontal Scroll on Mobile */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[300px] sm:min-w-0">
          <StatsCards />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground/80">{t.dashboard.cash_flow}</h3>
        <OverviewChart />
      </div>

      <div className="pt-4 border-t border-border/50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {t.dashboard.my_work}
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.dashboard.personal}</span>
        </h2>
        <UserDashboard />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { currentUser } = useProjects()

  // Determine View
  const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

  return isAdmin ? <AdminDashboard /> : <UserDashboard />
}
