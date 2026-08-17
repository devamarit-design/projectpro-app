"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useProjects } from "@/context/project-context"
import { format, startOfMonth, subMonths, eachMonthOfInterval, startOfWeek, subWeeks, eachWeekOfInterval, parseISO, isSameMonth, isSameWeek, endOfWeek, endOfMonth } from "date-fns"
import { enUS, th } from "date-fns/locale"
import { useTranslation } from "@/lib/i18n-context"

export function CashFlowChart() {
    const { expenses, incomes } = useProjects()
    const { locale } = useTranslation() // Assuming useTranslation provides locale
    const [view, setView] = useState<'monthly' | 'weekly'>('monthly')

    const dateLocale = locale === 'th' ? th : enUS

    // Generate Data
    const data = useMemo(() => {
        const today = new Date()

        if (view === 'monthly') {
            // Last 6 months + Current
            const start = startOfMonth(subMonths(today, 6))
            const months = eachMonthOfInterval({ start, end: today })

            return months.map(month => {
                const monthExpenses = expenses
                    .filter(e => isSameMonth(parseISO(e.date), month))
                    .reduce((sum, e) => sum + e.totalValue, 0)

                const monthIncome = incomes
                    .filter(i => i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced') && isSameMonth(parseISO(i.date), month))
                    .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

                return {
                    name: format(month, 'MMM', { locale: dateLocale }),
                    fullName: format(month, 'MMMM yyyy', { locale: dateLocale }),
                    income: monthIncome,
                    expense: monthExpenses
                }
            })
        } else {
            // Last 8 weeks
            const start = startOfWeek(subWeeks(today, 7))
            const weeks = eachWeekOfInterval({ start, end: today })

            return weeks.map(week => {
                const weekExpenses = expenses
                    .filter(e => isSameWeek(parseISO(e.date), week))
                    .reduce((sum, e) => sum + e.totalValue, 0)

                const weekIncome = incomes
                    .filter(i => i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced') && isSameWeek(parseISO(i.date), week))
                    .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

                const weekEnd = endOfWeek(week)
                return {
                    name: `${format(week, 'd MMM', { locale: dateLocale })}`,
                    fullName: `${format(week, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy', { locale: dateLocale })}`,
                    income: weekIncome,
                    expense: weekExpenses
                }
            })
        }
    }, [view, expenses, incomes, locale, dateLocale])

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Cash Flow</h3>
                <div className="bg-muted p-1 rounded-xl flex items-center">
                    <button
                        onClick={() => setView('monthly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setView('weekly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'weekly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Weekly
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full relative group">
                {/* Premium Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
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
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-popover border border-border p-3 rounded-xl shadow-xl outline-none">
                                            <p className="text-sm font-semibold mb-2">{payload[0].payload.fullName}</p>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                                                    <span className="text-muted-foreground">Income:</span>
                                                    <span className="font-mono font-medium ml-auto">฿{Number(payload[0].value).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                                                    <span className="text-muted-foreground">Expense:</span>
                                                    <span className="font-mono font-medium ml-auto">฿{Number(payload[1].value).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={50}
                        />
                        <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
