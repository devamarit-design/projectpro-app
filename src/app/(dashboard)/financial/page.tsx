"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useProjects } from "@/context/project-context"
import { FinancialKpiCards } from "@/components/dashboard/financial-kpi-cards"
import { ProjectBreakdownDetails } from "@/components/dashboard/project-breakdown-details"
import { ProjectMatrixTable } from "@/components/dashboard/project-matrix-table"
import { DownloadReportDialog } from "@/components/dashboard/download-report-dialog"
import {
    ArrowLeft,
    Download,
    Filter,
    FolderKanban,
    Sparkles,
    BarChart2,
    PieChart,
    ChevronDown
} from "lucide-react"

const CashFlowChart = dynamic(() => import("@/components/dashboard/cash-flow-chart").then(mod => mod.CashFlowChart), {
    ssr: false,
    loading: () => <div className="h-[320px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const ProjectFinancialsChart = dynamic(() => import("@/components/dashboard/project-financials-chart").then(mod => mod.ProjectFinancialsChart), {
    ssr: false,
    loading: () => <div className="h-[320px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const ExpenseCategoryChart = dynamic(() => import("@/components/dashboard/expense-category-chart").then(mod => mod.ExpenseCategoryChart), {
    ssr: false,
    loading: () => <div className="h-[320px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

const MonthlySummary = dynamic(() => import("@/components/dashboard/monthly-summary").then(mod => mod.MonthlySummary), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/10 rounded-2xl" />
})

export default function FinancialPage() {
    const { projects } = useProjects()
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
    const [showDownloadDialog, setShowDownloadDialog] = useState(false)

    const isAll = selectedProjectId === "all"

    return (
        <div className="space-y-6 pb-24 pt-4 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            {/* Header with Navigation and Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            กลับหน้าแดชบอร์ดหลัก
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            Financial Intelligence
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                        Financial Reports & Project Analytics
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        รายงานสรุปกระแสเงินสด วิเคราะห์ต้นทุน และผลประกอบการเชิงลึกแยกตามโครงการ
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Project Filter Dropdown */}
                    <div className="relative flex items-center bg-muted/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
                        <span className="text-muted-foreground mr-1.5">โครงการ:</span>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            aria-label="เลือกโครงการ"
                            className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                        >
                            <option value="all" className="bg-popover text-foreground">ทุกโครงการ (All Projects)</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id} className="bg-popover text-foreground">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Download Report Button */}
                    <button
                        onClick={() => setShowDownloadDialog(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลดรายงาน</span>
                    </button>
                </div>
            </div>

            {/* Top KPI Cards (Updates dynamically when a project is selected) */}
            <FinancialKpiCards selectedProjectId={selectedProjectId} />

            {/* Condition: Specific Project Selected vs All Projects Overview */}
            {!isAll ? (
                /* Specific Project Deep Dive */
                <div className="space-y-6">
                    <ProjectBreakdownDetails
                        projectId={selectedProjectId}
                        onClearProject={() => setSelectedProjectId("all")}
                    />

                    {/* Project Specific Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Cash Flow */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
                            <div className="relative z-10">
                                <CashFlowChart projectId={selectedProjectId} />
                            </div>
                        </div>

                        {/* Project Expense Category Breakdown */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                            <div className="relative z-10">
                                <ExpenseCategoryChart selectedProjectId={selectedProjectId} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* All Projects Full Analytics View */
                <div className="space-y-6">
                    {/* Row 1: Cash Flow & Project Financials Bar Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cash Flow */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
                            <div className="relative z-10">
                                <CashFlowChart />
                            </div>
                        </div>

                        {/* Project Financials Comparison */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
                            <div className="relative z-10">
                                <ProjectFinancialsChart onSelectProject={(pid) => setSelectedProjectId(pid)} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Expense Category Breakdown (Donut) & Monthly Summary Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute -top-20 -left-20 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <ExpenseCategoryChart />
                            </div>
                        </div>

                        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="relative z-10">
                                <MonthlySummary />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Comprehensive Project Matrix Table */}
                    <div className="pt-2">
                        <ProjectMatrixTable onSelectProject={(pid) => setSelectedProjectId(pid)} />
                    </div>
                </div>
            )}

            {/* Download Report Modal Dialog */}
            <DownloadReportDialog
                open={showDownloadDialog}
                onOpenChange={setShowDownloadDialog}
            />
        </div>
    )
}
