"use client"

import { useMemo } from "react"
import { useProjects } from "@/context/project-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, Target, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react"

interface FinancialKpiCardsProps {
    selectedProjectId?: string
}

export function FinancialKpiCards({ selectedProjectId }: FinancialKpiCardsProps) {
    const { projects, expenses, incomes } = useProjects()

    const metrics = useMemo(() => {
        const isAll = !selectedProjectId || selectedProjectId === "all"

        let targetProjects = isAll ? projects : projects.filter(p => p.id === selectedProjectId)
        const selectedProject = !isAll ? projects.find(p => p.id === selectedProjectId) : null

        // Calculate Revenue (Invoices)
        let totalRevenue = 0
        let paidRevenue = 0
        let pendingRevenue = 0
        let invoiceCount = 0

        const relevantIncomes = isAll 
            ? incomes 
            : incomes.filter(i => i.projectId === selectedProjectId)

        relevantIncomes.forEach(i => {
            if (i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced')) {
                const val = i.grandTotal || 0
                totalRevenue += val
                invoiceCount++
                if (i.status === 'Paid') {
                    paidRevenue += val
                } else {
                    pendingRevenue += val
                }
            }
        })

        // If manual fallback is needed when no invoices exist
        if (totalRevenue === 0) {
            targetProjects.forEach(p => {
                const manual = parseInt((p.income || "0").replace(/[^0-9]/g, '')) || 0
                totalRevenue += manual
                paidRevenue += manual
            })
        }

        // Calculate Expenses
        let totalExpense = 0
        let expenseCount = 0

        if (isAll) {
            expenses.forEach(e => {
                if (e.isDeleted || e.status === 'Unpaid') return
                totalExpense += (e.totalValue || 0)
                expenseCount++
            })
        } else {
            expenses.forEach(e => {
                const amt = getExpenseAmountForProject(e, selectedProjectId)
                if (amt > 0) {
                    totalExpense += amt
                    expenseCount++
                }
            })
            // Fallback manual expense
            if (totalExpense === 0 && selectedProject) {
                totalExpense = parseInt((selectedProject.expenses || "0").replace(/[^0-9]/g, '')) || 0
            }
        }

        // Net Profit & Margin
        const netProfit = totalRevenue - totalExpense
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

        // Total Budget
        const totalBudget = targetProjects.reduce((sum, p) => {
            const b = parseInt((p.budget || "0").replace(/[^0-9]/g, '')) || 0
            return sum + b
        }, 0)

        const budgetBurnRate = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0

        return {
            totalRevenue,
            paidRevenue,
            pendingRevenue,
            invoiceCount,
            totalExpense,
            expenseCount,
            netProfit,
            profitMargin,
            totalBudget,
            budgetBurnRate,
            activeProjectsCount: targetProjects.filter(p => p.status === 'In Progress').length,
            totalProjectsCount: targetProjects.length,
            selectedProject
        }
    }, [projects, expenses, incomes, selectedProjectId])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Revenue Card */}
            <div className="relative overflow-hidden rounded-2xl glass-card border border-white/5 p-5 group hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {metrics.selectedProject ? "รายรับโครงการ (Revenue)" : "รายรับรวม (Total Revenue)"}
                    </span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                        ฿{metrics.totalRevenue.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1 text-emerald-400">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        รับชำระแล้ว ฿{metrics.paidRevenue.toLocaleString()}
                    </span>
                    {metrics.pendingRevenue > 0 && (
                        <span className="text-amber-400/90 font-mono">
                            ค้างรับ ฿{metrics.pendingRevenue.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. Total Expense Card */}
            <div className="relative overflow-hidden rounded-2xl glass-card border border-white/5 p-5 group hover:border-rose-500/30 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {metrics.selectedProject ? "รายจ่ายโครงการ (Expenses)" : "รายจ่ายรวม (Total Expenses)"}
                    </span>
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                        <Wallet className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                        ฿{metrics.totalExpense.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
                    <span className="text-muted-foreground">
                        บันทึก {metrics.expenseCount} รายการ
                    </span>
                    {metrics.totalBudget > 0 && (
                        <span className={`font-mono font-medium ${metrics.budgetBurnRate > 90 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                            ใช้ไป {metrics.budgetBurnRate.toFixed(1)}% ของงบ
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Net Profit Card */}
            <div className="relative overflow-hidden rounded-2xl glass-card border border-white/5 p-5 group hover:border-emerald-500/30 transition-all duration-300">
                <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl transition-all pointer-events-none ${metrics.netProfit >= 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        กำไรสุทธิ (Net Profit)
                    </span>
                    <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${metrics.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <PiggyBank className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {metrics.netProfit >= 0 ? "+" : ""}฿{metrics.netProfit.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1 font-semibold">
                        {metrics.profitMargin >= 0 ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> Margin +{metrics.profitMargin.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="text-red-400 flex items-center gap-0.5">
                                <TrendingDown className="w-3.5 h-3.5" /> Margin {metrics.profitMargin.toFixed(1)}%
                            </span>
                        )}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        {metrics.netProfit >= 0 ? "ผลประกอบการบวก" : "ต้องควบคุมต้นทุน"}
                    </span>
                </div>
            </div>

            {/* 4. Budget & Project Health Card */}
            <div className="relative overflow-hidden rounded-2xl glass-card border border-white/5 p-5 group hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {metrics.selectedProject ? "งบประมาณโครงการ (Budget)" : "งบประมาณรวม (Total Budget)"}
                    </span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                        {metrics.selectedProject ? <Target className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                        ฿{metrics.totalBudget.toLocaleString()}
                    </span>
                </div>
                <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>สัดส่วนต้นทุน / งบ</span>
                        <span className="font-mono font-medium text-foreground">{metrics.budgetBurnRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                metrics.budgetBurnRate > 100 
                                    ? 'bg-rose-500' 
                                    : metrics.budgetBurnRate > 80 
                                        ? 'bg-amber-500' 
                                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.min(metrics.budgetBurnRate, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
