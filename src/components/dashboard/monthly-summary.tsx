"use client"

import { useProjects } from "@/context/project-context"
import { format, startOfMonth, subMonths, eachMonthOfInterval, parseISO, isSameMonth } from "date-fns"
import { enUS, th } from "date-fns/locale"
import { useTranslation } from "@/lib/i18n-context"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function MonthlySummary() {
    const { expenses, incomes } = useProjects()
    const { locale } = useTranslation()
    const dateLocale = locale === 'th' ? th : enUS

    const today = new Date()
    const start = startOfMonth(subMonths(today, 5)) // Last 6 months inclusive
    const months = eachMonthOfInterval({ start, end: today }).reverse() // Newest first

    const data = months.map(month => {
        const monthExpenses = expenses
            .filter(e => isSameMonth(parseISO(e.date), month))
            .reduce((sum, e) => sum + e.totalValue, 0)

        const monthIncome = incomes
            .filter(i => i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced') && isSameMonth(parseISO(i.date), month))
            .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

        const net = monthIncome - monthExpenses
        const margin = monthIncome > 0 ? (net / monthIncome) * 100 : 0

        return {
            month: format(month, 'MMMM yyyy', { locale: dateLocale }),
            income: monthIncome,
            expense: monthExpenses,
            net,
            margin
        }
    })

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold px-1">Monthly Summary</h3>
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4 text-right">Income</th>
                                <th className="px-6 py-4 text-right">Expenses</th>
                                <th className="px-6 py-4 text-right">Net Flow</th>
                                <th className="px-6 py-4 text-right">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-medium">{row.month}</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-400">
                                        ฿{row.income.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-red-400">
                                        ฿{row.expense.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`flex items-center justify-end gap-1.5 font-mono font-medium ${row.net > 0 ? 'text-emerald-400' : row.net < 0 ? 'text-pink-500' : 'text-muted-foreground'}`}>
                                            {row.net > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : row.net < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                            {row.net > 0 ? '+' : ''}฿{row.net.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${row.margin >= 20 ? 'bg-emerald-500/10 text-emerald-500' : row.margin > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {row.margin.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
