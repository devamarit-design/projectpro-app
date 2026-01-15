"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

import { useProjects } from "@/context/project-context"

export function OverviewChart() {
    const { expenses, incomes } = useProjects()

    // Aggregate Data by Month (Last 6-12 Months?)
    // For simplicity, let's take ALL data and group by Mon-Year, then sort?
    // Or just "This Year" Jan-Dec?
    // Let's do: Last 7 Months dynamically

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const getLast7Months = () => {
        const months = []
        const today = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
            months.push({
                name: monthNames[d.getMonth()],
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, // YYYY-MM
                year: d.getFullYear()
            })
        }
        return months
    }

    const last7Months = getLast7Months()

    const data = last7Months.map(m => {
        // Calculate Expenses for this month
        const monthlyExpenses = expenses
            .filter(e => e.date.startsWith(m.key))
            .reduce((sum, e) => sum + e.totalValue, 0)

        // Calculate Income for this month
        const monthlyIncome = incomes
            .filter(i => (i.status === 'Paid' || i.status === 'Accepted') && i.date.startsWith(m.key))
            .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

        return {
            name: m.name,
            income: monthlyIncome,
            expense: monthlyExpenses
        }
    })

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value: any) => `฿${Number(value).toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
        </ResponsiveContainer>
    )
}
