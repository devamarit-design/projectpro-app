"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useProjects } from "@/context/project-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { Layers, ArrowUpDown, ExternalLink } from "lucide-react"

interface ProjectFinancialsChartProps {
    onSelectProject?: (projectId: string) => void
}

export function ProjectFinancialsChart({ onSelectProject }: ProjectFinancialsChartProps) {
    const { projects, expenses, incomes } = useProjects()
    const [sortBy, setSortBy] = useState<'income' | 'profit' | 'expense' | 'margin'>('income')
    const [displayLimit, setDisplayLimit] = useState<number>(5)

    const data = useMemo(() => {
        const list = projects.map(p => {
            const projectExpenses = expenses
                .filter(e => !e.isDeleted && e.status !== 'Unpaid' && (e.projectId === p.id || e.items?.some(i => i.projectId === p.id)))
                .reduce((sum, e) => sum + getExpenseAmountForProject(e, p.id), 0)

            const projectIncome = incomes
                .filter(i => i.projectId === p.id && i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced'))
                .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

            const manualIncome = parseInt((p.income || "0").replace(/[^0-9]/g, '')) || 0
            const finalIncome = projectIncome > 0 ? projectIncome : manualIncome

            const manualExpense = parseInt((p.expenses || "0").replace(/[^0-9]/g, '')) || 0
            const finalExpense = projectExpenses > 0 ? projectExpenses : manualExpense

            const profit = finalIncome - finalExpense
            const margin = finalIncome > 0 ? (profit / finalIncome) * 100 : 0

            return {
                id: p.id,
                name: p.name,
                customer: p.customer,
                income: finalIncome,
                expense: finalExpense,
                profit,
                margin
            }
        })

        list.sort((a, b) => {
            if (sortBy === 'profit') return b.profit - a.profit
            if (sortBy === 'expense') return b.expense - a.expense
            if (sortBy === 'margin') return b.margin - a.margin
            return b.income - a.income
        })

        return displayLimit > 0 ? list.slice(0, displayLimit) : list
    }, [projects, expenses, incomes, sortBy, displayLimit])

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-400" />
                        เปรียบเทียบการเงินรายโครงการ
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        คลิกที่แท่งกราฟเพื่อดูการวิเคราะห์เจาะลึกของโครงการนั้น
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort selector */}
                    <div className="flex items-center bg-muted/60 rounded-xl p-1 border border-white/5 text-xs">
                        <span className="text-[11px] text-muted-foreground px-2 flex items-center gap-1">
                            <ArrowUpDown className="w-3 h-3" /> เรียงตาม:
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            aria-label="เรียงลำดับตาม"
                            className="bg-transparent text-foreground text-xs font-medium pr-2 focus:outline-none cursor-pointer"
                        >
                            <option value="income" className="bg-popover text-foreground">รายรับ</option>
                            <option value="profit" className="bg-popover text-foreground">กำไรสุทธิ</option>
                            <option value="expense" className="bg-popover text-foreground">รายจ่าย</option>
                            <option value="margin" className="bg-popover text-foreground">Margin %</option>
                        </select>
                    </div>

                    {/* Limit toggle */}
                    <div className="flex items-center bg-muted/60 rounded-xl p-1 border border-white/5 text-xs">
                        {[5, 10, 0].map((num) => (
                            <button
                                key={num}
                                onClick={() => setDisplayLimit(num)}
                                className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                                    displayLimit === num
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {num === 0 ? "ทั้งหมด" : `Top ${num}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full relative group">
                {/* Premium Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        barGap={4}
                        margin={{ left: 0, right: 20 }}
                        onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                                const pid = state.activePayload[0].payload.id
                                if (onSelectProject && pid) {
                                    onSelectProject(pid)
                                }
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.25} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={110}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.15 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload
                                    const profit = Number(item.profit)
                                    const margin = Number(item.margin)
                                    return (
                                        <div className="bg-popover/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-2xl outline-none z-50 min-w-[220px]">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-bold text-foreground truncate max-w-[160px]">{label}</p>
                                                <span className="text-[10px] text-blue-400 font-medium flex items-center gap-0.5">
                                                    คลิกเพื่อดูเจาะลึก <ExternalLink className="w-2.5 h-2.5" />
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500" /> รายรับ:
                                                    </span>
                                                    <span className="font-mono font-medium text-foreground">฿{Number(item.income).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-rose-500" /> รายจ่าย:
                                                    </span>
                                                    <span className="font-mono font-medium text-foreground">฿{Number(item.expense).toLocaleString()}</span>
                                                </div>
                                                <div className="h-px bg-border/60 my-1" />
                                                <div className="flex items-center justify-between font-semibold">
                                                    <span className={profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                        {profit >= 0 ? "กำไรสุทธิ:" : "ขาดทุนสุทธิ:"}
                                                    </span>
                                                    <span className={`font-mono ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                        {profit >= 0 ? "+" : ""}฿{profit.toLocaleString()} ({margin.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill="#3b82f6"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={18}
                            className="cursor-pointer"
                        />
                        <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="#f43f5e"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={18}
                            className="cursor-pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
