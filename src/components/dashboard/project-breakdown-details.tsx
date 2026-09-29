"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useProjects, Project } from "@/context/project-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { format, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import { getGoogleMapsUrl, formatLocationDisplay } from "@/lib/utils"
import {
    Building2,
    Calendar,
    MapPin,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    FileText,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    X
} from "lucide-react"

interface ProjectBreakdownDetailsProps {
    projectId: string
    onClearProject: () => void
}

export function ProjectBreakdownDetails({ projectId, onClearProject }: ProjectBreakdownDetailsProps) {
    const { projects, expenses, incomes } = useProjects()

    const project = useProjects().projects.find(p => p.id === projectId)

    const details = useMemo(() => {
        if (!project) return null

        // Expenses
        const projectExpensesList = expenses
            .filter(e => !e.isDeleted && e.status !== 'Unpaid' && (e.projectId === project.id || e.items?.some(i => i.projectId === project.id)))
            .map(e => ({
                id: e.id,
                title: e.title,
                date: e.date,
                category: e.category,
                amount: getExpenseAmountForProject(e, project.id),
                payee: e.payee || e.vendor || e.paidBy || "ทั่วไป"
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const totalExpenses = projectExpensesList.reduce((sum, e) => sum + e.amount, 0)

        // Incomes
        const projectIncomesList = incomes
            .filter(i => i.projectId === project.id && i.type === 'Invoice')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const totalInvoiced = projectIncomesList
            .filter(i => i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced')
            .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

        const totalPaid = projectIncomesList
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

        const budgetNum = parseInt((project.budget || "0").replace(/[^0-9]/g, '')) || 0
        const budgetUsedPercent = budgetNum > 0 ? (totalExpenses / budgetNum) * 100 : 0

        // Tasks Breakdown
        const tasks = project.tasks || []
        const totalTasks = tasks.length
        const doneTasks = tasks.filter(t => t.status === 'Done').length
        const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
        const todoTasks = tasks.filter(t => t.status === 'Todo').length
        const taskCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (project.progress || 0)

        // Subprojects
        const subProjects = project.subProjects || []

        return {
            totalExpenses,
            totalInvoiced,
            totalPaid,
            budgetNum,
            budgetUsedPercent,
            projectExpensesList: projectExpensesList.slice(0, 5), // top 5 recent
            projectIncomesList: projectIncomesList.slice(0, 5),
            totalTasks,
            doneTasks,
            inProgressTasks,
            todoTasks,
            taskCompletion,
            subProjects
        }
    }, [project, expenses, incomes])

    if (!project || !details) {
        return (
            <div className="p-8 text-center glass-card rounded-2xl border border-white/5 text-muted-foreground">
                ไม่พบข้อมูลโครงการที่ระบุ
            </div>
        )
    }

    const netProfit = details.totalInvoiced - details.totalExpenses
    const margin = details.totalInvoiced > 0 ? (netProfit / details.totalInvoiced) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Project Header Banner */}
            <div className="relative overflow-hidden glass-card rounded-2xl border border-white/10 p-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                                {project.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                รหัส: #{project.id.slice(0, 6)}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">
                            {project.name}
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                            {project.customer && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                    ลูกค้า: {project.customer}
                                </span>
                            )}
                            {project.location && (
                                getGoogleMapsUrl(project.location, project.mapUrl) ? (
                                    <a
                                        href={getGoogleMapsUrl(project.location, project.mapUrl)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:underline transition-colors max-w-xs truncate"
                                        title={project.location}
                                    >
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{formatLocationDisplay(project.location, "ดูพิกัดแผนที่ (Google Maps)")}</span>
                                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                    </a>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                        {project.location}
                                    </span>
                                )
                            )}
                            {(project.startDate || project.endDate) && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                    {project.startDate || "-"} ถึง {project.endDate || "-"}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-colors"
                        >
                            เปิดหน้าโครงการ <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                            onClick={onClearProject}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium border border-white/5 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" /> ดูทุกโครงการ
                        </button>
                    </div>
                </div>

                {/* Budget Utilization Meter */}
                <div className="mt-6 pt-5 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">การใช้งบประมาณ (Budget Consumption)</span>
                            {details.budgetUsedPercent > 100 && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                    <AlertCircle className="w-3 h-3" /> เกินงบ {(details.budgetUsedPercent - 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <span className="font-mono text-muted-foreground">
                            ใช้ไป ฿{details.totalExpenses.toLocaleString()} / งบ ฿{details.budgetNum.toLocaleString()} ({details.budgetUsedPercent.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${
                                details.budgetUsedPercent > 100
                                    ? 'bg-rose-500'
                                    : details.budgetUsedPercent > 85
                                        ? 'bg-amber-500'
                                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min(details.budgetUsedPercent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Metrics & Task Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Invoiced vs Paid */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider">ใบแจ้งหนี้ / รายรับ</span>
                        <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xl font-bold font-mono text-foreground">
                        ฿{details.totalInvoiced.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="text-muted-foreground">รับชำระแล้ว:</span>
                        <span className="font-mono text-emerald-400 font-semibold">฿{details.totalPaid.toLocaleString()}</span>
                    </div>
                </div>

                {/* 2. Profit & Margin */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider">กำไรของโครงการนี้</span>
                        {netProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                    </div>
                    <p className={`text-xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {netProfit >= 0 ? "+" : ""}฿{netProfit.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="text-muted-foreground">อัตรากำไร (Margin):</span>
                        <span className={`font-mono font-semibold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {margin.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* 3. Task / Works Progress */}
                <div className="glass-card rounded-2xl border border-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider">ความคืบหน้างาน</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold font-mono text-foreground">
                        {details.taskCompletion}%
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-white/5">
                        <span>เสร็จ {details.doneTasks} งาน</span>
                        <span>กำลังทำ {details.inProgressTasks}</span>
                        <span>รอทำ {details.todoTasks}</span>
                    </div>
                </div>
            </div>

            {/* Recent Expenses List for this project */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Expenses */}
                <div className="glass-card rounded-2xl border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-rose-400" />
                            รายการค่าใช้จ่ายล่าสุดของโครงการ
                        </h4>
                        <Link href="/expenses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {details.projectExpensesList.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">ไม่มีรายการค่าใช้จ่ายในโครงการนี้</p>
                    ) : (
                        <div className="space-y-2">
                            {details.projectExpensesList.map((exp) => (
                                <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-white/5 hover:border-white/10 transition-colors text-xs">
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">{exp.title}</p>
                                        <p className="text-[11px] text-muted-foreground">{exp.payee} • {exp.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-rose-400">฿{exp.amount.toLocaleString()}</p>
                                        <span className="text-[10px] text-muted-foreground">{exp.category || "อื่นๆ"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Invoices */}
                <div className="glass-card rounded-2xl border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            ใบแจ้งหนี้ / งวดรับเงิน
                        </h4>
                        <Link href="/income" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {details.projectIncomesList.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มีใบแจ้งหนี้สำหรับโครงการนี้</p>
                    ) : (
                        <div className="space-y-2">
                            {details.projectIncomesList.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-white/5 hover:border-white/10 transition-colors text-xs">
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">
                                            {inv.documentNumber || inv.note || "ใบแจ้งหนี้"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">{inv.date}</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <p className="font-mono font-bold text-blue-400">฿{(inv.grandTotal || 0).toLocaleString()}</p>
                                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                            inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
