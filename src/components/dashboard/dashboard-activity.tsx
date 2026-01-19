"use client"

import * as React from "react"
import { useProjects, Expense, IncomeDocument } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Filter, Calendar, Building2, User } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from "@/lib/i18n-context"
import ExpenseDetailSheet from "@/components/expenses/expense-detail-sheet"

import { IncomeDetailSheet } from "@/components/income/income-detail-sheet"

import { useRouter } from "next/navigation"

interface DashboardActivityProps {
    className?: string
    limit?: number
    showViewAll?: boolean
}

export function DashboardActivity({ className, limit, showViewAll = false }: DashboardActivityProps) {
    const router = useRouter()
    const { expenses, incomes, projects, users, currentUser } = useProjects()
    const { t } = useTranslation()

    // Filters
    const [projectFilter, setProjectFilter] = React.useState<string>("all")
    const [userFilter, setUserFilter] = React.useState<string>("all")
    const [sortBy, setSortBy] = React.useState<'timestamp' | 'date'>('timestamp')

    // Selection State
    const [selectedExpenseId, setSelectedExpenseId] = React.useState<string | null>(null)
    const [selectedIncomeId, setSelectedIncomeId] = React.useState<string | null>(null)

    const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

    const processedActivities = React.useMemo(() => {
        // 1. Map Expenses -> Activity
        const expenseActivities = expenses
            .filter(e => {
                if (!isAdmin && e.status === 'Advanced') return false
                return true
            })
            .map(e => ({
                id: e.id,
                type: 'expense' as const,
                title: e.title,
                amount: e.totalValue,
                // If sorting by timestamp, use createdAt (or fallback to date if missing). 
                // However, the requested "Time Stamp" usually refers to creation time. 
                // Since our mock data / interface might not always populate createdAt reliably for everything,
                // we'll try to use createdAt, else fallback.
                timestamp: e.createdAt || e.date,
                date: e.date, // Document Date (Bill Date)
                subtitle: e.payee || "Unknown Payee",
                status: e.status,
                projectId: e.projectId,
                userMatch: e.payee
            }))

        // 2. Map Incomes -> Activity
        const incomeActivities = incomes.map(i => ({
            id: i.id,
            type: 'income' as const,
            title: i.documentNumber,
            amount: i.total,
            timestamp: i.createdAt || i.date, // Fallback
            date: i.date,
            subtitle: projects.find(p => p.id === i.projectId)?.name || "Unknown Project",
            status: i.status,
            projectId: i.projectId,
            userMatch: null
        }))

        // 3. Combine
        let all = [...expenseActivities, ...incomeActivities]

        // 4. Apply Filters
        if (projectFilter !== "all") {
            all = all.filter(a => a.projectId === projectFilter)
        }

        if (userFilter !== "all") {
            all = all.filter(a => a.type === 'expense' && a.userMatch === userFilter)
        }


        const displayLimit = limit || 20
        return all.sort((a, b) => {
            const dateA = sortBy === 'timestamp' ? new Date(a.timestamp).getTime() : new Date(a.date).getTime()
            const dateB = sortBy === 'timestamp' ? new Date(b.timestamp).getTime() : new Date(b.date).getTime()
            return dateB - dateA
        }).slice(0, displayLimit)

    }, [expenses, incomes, projects, projectFilter, userFilter, isAdmin, sortBy])

    // Grouping Logic
    const groupedActivities = React.useMemo(() => {
        const groups: { [key: string]: typeof processedActivities } = {}

        processedActivities.forEach(item => {
            const dateObj = new Date(sortBy === 'timestamp' ? item.timestamp : item.date)
            // Format: YYYY-MM-DD for grouping key
            const key = format(dateObj, 'yyyy-MM-dd')
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        })

        // Sort keys (dates) descending
        return Object.keys(groups)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(dateKey => {
                const date = new Date(dateKey)
                const today = new Date()
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)

                let title = format(date, 'dd MMM yyyy')
                if (dateKey === format(today, 'yyyy-MM-dd')) title = "Today"
                if (dateKey === format(yesterday, 'yyyy-MM-dd')) title = "Yesterday"

                return {
                    title,
                    items: groups[dateKey]
                }
            })
    }, [processedActivities, sortBy])

    const handleItemClick = (item: any) => {
        if (item.type === 'expense') {
            setSelectedExpenseId(item.id)
        } else if (item.type === 'income') {
            setSelectedIncomeId(item.id)
        }
    }

    return (
        <>
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6 h-full overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        {t.dashboard.activity_feed}
                    </h3>

                    {/* Sorting & Filters */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Sort Toggle */}
                        <div className="relative flex-1 sm:min-w-[120px]">
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                {sortBy === 'timestamp' ? <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> : <Filter className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full pl-8 pr-2 py-1.5 bg-background/50 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <option value="timestamp">By Created Time</option>
                                <option value="date">By Bill Date</option>
                            </select>
                        </div>

                        {/* Project Filter */}
                        <div className="relative flex-1 sm:min-w-[100px]">
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="w-full px-2 py-1.5 bg-background/50 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8 appearance-none cursor-pointer hover:bg-white/5 transition-colors text-center"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                    {groupedActivities.length > 0 ? (
                        groupedActivities.map((group) => (
                            <div key={group.title} className="space-y-3">
                                <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                        {group.title}
                                    </h4>
                                </div>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            onClick={() => handleItemClick(item)}
                                            className={cn("flex items-center justify-between group transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                                                    item.type === 'income'
                                                        ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                        : "bg-red-500/10 border-red-500/20 text-red-500"
                                                )}>
                                                    {item.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="truncate max-w-[120px]">{item.subtitle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className={cn("font-bold text-sm whitespace-nowrap",
                                                    item.type === 'income' ? "text-green-500" : "text-foreground"
                                                )}>
                                                    {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString()}
                                                </p>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border capitalize inline-block mt-1",
                                                    item.status === 'Paid' || item.status === 'Invoiced' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        item.status === 'Pending' || item.status === 'Sent' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50 flex flex-col items-center justify-center h-full">
                            <Filter className="w-8 h-8 mb-2" />
                            <p className="text-xs">{t.dashboard.no_activity}</p>
                        </div>
                    )}
                </div>

                {showViewAll && (
                    <div className="pt-2 border-t border-white/5 mt-auto">
                        <button
                            onClick={() => router.push('/activity')}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            View All Activity
                        </button>
                    </div>
                )}
            </div>

            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
            />

            <IncomeDetailSheet
                documentId={selectedIncomeId}
                onClose={() => setSelectedIncomeId(null)}
            />
        </>
    )
}
