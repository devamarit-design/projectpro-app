"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line, ComposedChart, Area } from "recharts"
import { useProjects } from "@/context/project-context"
import { format, startOfMonth, subMonths, eachMonthOfInterval, startOfWeek, subWeeks, eachWeekOfInterval, parseISO, isSameMonth, isSameWeek, endOfWeek } from "date-fns"
import { enUS, th } from "date-fns/locale"
import { useTranslation } from "@/lib/i18n-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { TrendingUp, BarChart3, Activity } from "lucide-react"

interface CashFlowChartProps {
    projectId?: string
}

export function CashFlowChart({ projectId }: CashFlowChartProps) {
    const { expenses, incomes, projects } = useProjects()
    const { locale } = useTranslation()
    const [view, setView] = useState<'monthly' | 'weekly'>('monthly')
    const [showNetLine, setShowNetLine] = useState(true)

    const dateLocale = locale === 'th' ? th : enUS
    const isAll = !projectId || projectId === "all"

    const selectedProjectName = useMemo(() => {
        if (isAll) return null
        return projects.find(p => p.id === projectId)?.name || "โครงการที่เลือก"
    }, [projects, projectId, isAll])

    // Generate Data
    const data = useMemo(() => {
        const today = new Date()

        if (view === 'monthly') {
            // Last 6 months + Current (7 points)
            const start = startOfMonth(subMonths(today, 6))
            const months = eachMonthOfInterval({ start, end: today })

            return months.map(month => {
                let monthExpenses = 0
                if (isAll) {
                    monthExpenses = expenses
                        .filter(e => !e.isDeleted && e.status !== 'Unpaid' && isSameMonth(parseISO(e.date), month))
                        .reduce((sum, e) => sum + (e.totalValue || 0), 0)
                } else {
                    monthExpenses = expenses
                        .filter(e => !e.isDeleted && e.status !== 'Unpaid' && isSameMonth(parseISO(e.date), month))
                        .reduce((sum, e) => sum + getExpenseAmountForProject(e, projectId), 0)
                }

                let monthIncome = incomes
                    .filter(i => {
                        const projectMatch = isAll || i.projectId === projectId
                        const typeMatch = i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced')
                        return projectMatch && typeMatch && isSameMonth(parseISO(i.date), month)
                    })
                    .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

                const netFlow = monthIncome - monthExpenses

                return {
                    name: format(month, 'MMM', { locale: dateLocale }),
                    fullName: format(month, 'MMMM yyyy', { locale: dateLocale }),
                    income: monthIncome,
                    expense: monthExpenses,
                    netFlow: netFlow
                }
            })
        } else {
            // Last 8 weeks
            const start = startOfWeek(subWeeks(today, 7))
            const weeks = eachWeekOfInterval({ start, end: today })

            return weeks.map(week => {
                let weekExpenses = 0
                if (isAll) {
                    weekExpenses = expenses
                        .filter(e => !e.isDeleted && e.status !== 'Unpaid' && isSameWeek(parseISO(e.date), week))
                        .reduce((sum, e) => sum + (e.totalValue || 0), 0)
                } else {
                    weekExpenses = expenses
                        .filter(e => !e.isDeleted && e.status !== 'Unpaid' && isSameWeek(parseISO(e.date), week))
                        .reduce((sum, e) => sum + getExpenseAmountForProject(e, projectId), 0)
                }

                let weekIncome = incomes
                    .filter(i => {
                        const projectMatch = isAll || i.projectId === projectId
                        const typeMatch = i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced')
                        return projectMatch && typeMatch && isSameWeek(parseISO(i.date), week)
                    })
                    .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

                const weekEnd = endOfWeek(week)
                const netFlow = weekIncome - weekExpenses

                return {
                    name: `${format(week, 'd MMM', { locale: dateLocale })}`,
                    fullName: `${format(week, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy', { locale: dateLocale })}`,
                    income: weekIncome,
                    expense: weekExpenses,
                    netFlow: netFlow
                }
            })
        }
    }, [view, expenses, incomes, dateLocale, isAll, projectId])

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        กระแสเงินสด (Cash Flow)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedProjectName ? `เฉพาะโครงการ: ${selectedProjectName}` : "วิเคราะห์รายรับ-รายจ่ายและสภาพคล่อง"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Net Trend */}
                    <button
                        onClick={() => setShowNetLine(!showNetLine)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                            showNetLine 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-muted/40 border-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                        title="แสดงเส้นกำไรสุทธิ"
                    >
                        เส้นกำไรสุทธิ
                    </button>

                    {/* Monthly / Weekly toggle */}
                    <div className="bg-muted/60 p-1 rounded-xl flex items-center border border-white/5">
                        <button
                            onClick={() => setView('monthly')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            รายเดือน
                        </button>
                        <button
                            onClick={() => setView('weekly')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'weekly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            รายสัปดาห์
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full relative group">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-[70px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-[70px] pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} barGap={6}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.25} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload
                                    const net = Number(item.netFlow)
                                    return (
                                        <div className="bg-popover/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-2xl outline-none min-w-[200px]">
                                            <p className="text-sm font-bold mb-2 text-foreground">{item.fullName}</p>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                        <span className="text-muted-foreground">รายรับ (Income):</span>
                                                    </div>
                                                    <span className="font-mono font-medium text-foreground">฿{Number(item.income).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                                        <span className="text-muted-foreground">รายจ่าย (Expense):</span>
                                                    </div>
                                                    <span className="font-mono font-medium text-foreground">฿{Number(item.expense).toLocaleString()}</span>
                                                </div>
                                                <div className="h-px bg-border/60 my-1" />
                                                <div className="flex items-center justify-between font-semibold">
                                                    <span className={net >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                        {net >= 0 ? "กำไรสุทธิ:" : "ขาดทุนสุทธิ:"}
                                                    </span>
                                                    <span className={`font-mono ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {net >= 0 ? "+" : ""}฿{net.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px' }} />
                        <Bar
                            dataKey="income"
                            name="รายรับ (Income)"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="expense"
                            name="รายจ่าย (Expense)"
                            fill="#f43f5e"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                        {showNetLine && (
                            <Line
                                type="monotone"
                                dataKey="netFlow"
                                name="กำไรสุทธิ (Net Flow)"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ fill: '#10b981', r: 3 }}
                                activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
