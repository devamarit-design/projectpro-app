"use client"

import { useState, useMemo } from "react"
import { useProjects } from "@/context/project-context"
import { getExpenseAmountForProject } from "@/lib/project-utils"
import { Search, ArrowUpDown, ChevronRight, TrendingUp, TrendingDown, Layers, Building2 } from "lucide-react"

interface ProjectMatrixTableProps {
    onSelectProject: (projectId: string) => void
}

export function ProjectMatrixTable({ onSelectProject }: ProjectMatrixTableProps) {
    const { projects, expenses, incomes } = useProjects()
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState<'income' | 'profit' | 'expense' | 'margin' | 'budget'>('profit')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const tableData = useMemo(() => {
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

            const budget = parseInt((p.budget || "0").replace(/[^0-9]/g, '')) || 0
            const profit = finalIncome - finalExpense
            const margin = finalIncome > 0 ? (profit / finalIncome) * 100 : 0
            const burnRate = budget > 0 ? (finalExpense / budget) * 100 : 0

            return {
                id: p.id,
                name: p.name,
                customer: p.customer || "-",
                status: p.status,
                budget,
                income: finalIncome,
                expense: finalExpense,
                profit,
                margin,
                burnRate
            }
        })

        // Filter
        const filtered = list.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer.toLowerCase().includes(searchTerm.toLowerCase())
        )

        // Sort
        filtered.sort((a, b) => {
            const multiplier = sortOrder === 'desc' ? -1 : 1
            return (a[sortField] - b[sortField]) * multiplier
        })

        return filtered
    }, [projects, expenses, incomes, searchTerm, sortField, sortOrder])

    const handleSort = (field: 'income' | 'profit' | 'expense' | 'margin' | 'budget') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-400" />
                        ตารางสรุปผลประกอบการแต่ละโครงการ (Project Performance Matrix)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        เปรียบเทียบงบประมาณ รายรับ ค่าใช้จ่าย และอัตรากำไรของทุกโครงการ
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อโครงการ หรือลูกค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-5 py-3.5">โครงการ / ลูกค้า</th>
                                <th className="px-4 py-3.5">สถานะ</th>
                                <th 
                                    className="px-4 py-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('budget')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        งบประมาณ <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('income')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        รายรับ <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('expense')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        รายจ่าย <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('profit')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        กำไรสุทธิ <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3.5 text-right cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('margin')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Margin % <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-4 py-3.5 text-center">ใช้ไปของงบ</th>
                                <th className="px-4 py-3.5 text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                                        ไม่พบข้อมูลโครงการ
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row) => (
                                    <tr 
                                        key={row.id} 
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                        onClick={() => onSelectProject(row.id)}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                                                {row.name}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Building2 className="w-3 h-3" /> {row.customer}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                row.status === 'Completed' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                    : row.status === 'In Progress'
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-medium text-foreground">
                                            ฿{row.budget.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-medium text-blue-400">
                                            ฿{row.income.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-medium text-rose-400">
                                            ฿{row.expense.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={`font-mono font-semibold ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {row.profit >= 0 ? "+" : ""}฿{row.profit.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={`inline-flex items-center gap-0.5 font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                                                row.margin >= 25 
                                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                                    : row.margin > 0 
                                                        ? 'bg-blue-500/10 text-blue-400' 
                                                        : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {row.margin >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {row.margin.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center min-w-[120px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            row.burnRate > 100 
                                                                ? 'bg-rose-500' 
                                                                : row.burnRate > 80 
                                                                    ? 'bg-amber-500' 
                                                                    : 'bg-primary'
                                                        }`}
                                                        style={{ width: `${Math.min(row.burnRate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                                                    {row.burnRate.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onSelectProject(row.id)
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors"
                                            >
                                                เจาะลึก <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
