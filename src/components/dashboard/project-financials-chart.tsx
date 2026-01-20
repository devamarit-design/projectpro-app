"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useProjects } from "@/context/project-context"
import { useRouter } from "next/navigation"

export function ProjectFinancialsChart() {
    const { projects, expenses, incomes } = useProjects()
    const router = useRouter()

    const data = projects.map(p => {
        const projectExpenses = expenses
            .filter(e => e.projectId === p.id)
            .reduce((sum, e) => sum + e.totalValue, 0)

        // Use incomeDocuments for verified income
        const projectIncome = incomes
            .filter(i => i.projectId === p.id && (i.status === 'Paid' || i.status === 'Accepted'))
            .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

        // Fallback to project manual input if 0
        const manualIncome = parseInt((p.income || "0").replace(/[^0-9]/g, '')) || 0
        const finalIncome = projectIncome > 0 ? projectIncome : manualIncome

        // Fallback expenses
        const manualExpense = parseInt((p.expenses || "0").replace(/[^0-9]/g, '')) || 0
        const finalExpense = projectExpenses > 0 ? projectExpenses : manualExpense

        return {
            id: p.id,
            name: p.name,
            income: finalIncome,
            expense: finalExpense,
            profit: finalIncome - finalExpense
        }
    })
        .sort((a, b) => b.income - a.income) // Sort by highest income
        .slice(0, 5) // Top 5

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Project Financials</h3>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Top 5 Projects</span>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} barGap={4} margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const profit = Number(payload[0].payload.profit)
                                    return (
                                        <div className="bg-popover border border-border p-3 rounded-xl shadow-xl outline-none z-50">
                                            <p className="text-sm font-semibold mb-2 max-w-[200px] truncate">{label}</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-muted-foreground">Income:</span>
                                                    <span className="font-mono font-medium ml-auto">฿{Number(payload[0].value).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                                    <span className="text-muted-foreground">Expense:</span>
                                                    <span className="font-mono font-medium ml-auto">฿{Number(payload[1].value).toLocaleString()}</span>
                                                </div>
                                                <div className="h-px bg-border my-1" />
                                                <div className="flex items-center gap-2 text-xs font-semibold">
                                                    <span className={profit >= 0 ? "text-green-500" : "text-red-500"}>
                                                        {profit >= 0 ? "Profit:" : "Loss:"}
                                                    </span>
                                                    <span className={`font-mono ml-auto ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                        {profit >= 0 ? "+" : ""}฿{profit.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                            barSize={12}
                        />
                        <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="#f87171"
                            radius={[0, 4, 4, 0]}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
