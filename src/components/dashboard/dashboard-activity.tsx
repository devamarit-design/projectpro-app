"use client"

import * as React from "react"
import { useProjects, Expense, IncomeDocument } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Filter, Calendar, Building2, User } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from "@/lib/i18n-context"

export function DashboardActivity() {
    const { expenses, incomes, projects, users, currentUser } = useProjects()
    const { t } = useTranslation()

    // Filters
    const [projectFilter, setProjectFilter] = React.useState<string>("all")
    const [userFilter, setUserFilter] = React.useState<string>("all")

    const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'

    // Combine and Filter Activities
    const activities = React.useMemo(() => {
        // 1. Map Expenses -> Activity
        const expenseActivities = expenses
            .filter(e => {
                // Security: Hide "Advanced" (Withdrawals) if not Admin
                if (!isAdmin && e.status === 'Advanced') return false
                return true
            })
            .map(e => ({
                id: e.id,
                type: 'expense' as const,
                title: e.title,
                amount: e.totalValue, // Using numeric value
                date: e.date,
                subtitle: e.payee || "Unknown Payee",
                status: e.status,
                projectId: e.projectId,
                // Helper for user filtering
                userMatch: e.payee
            }))

        // 2. Map Incomes -> Activity
        const incomeActivities = incomes.map(i => ({
            id: i.id,
            type: 'income' as const,
            title: i.documentNumber, // Show Doc No. as title
            amount: i.total,
            date: i.date,
            subtitle: projects.find(p => p.id === i.projectId)?.name || "Unknown Project",
            status: i.status,
            projectId: i.projectId,
            userMatch: null // Incomes usually don't have a specific "user" tied to them in this context easily, maybe creator but logic is simpler to skip or assume "System"
        }))

        // 3. Combine
        let all = [...expenseActivities, ...incomeActivities]

        // 4. Apply Filters
        if (projectFilter !== "all") {
            all = all.filter(a => a.projectId === projectFilter)
        }

        if (userFilter !== "all") {
            // Filter by user (Payee for expenses)
            // For incomes, we skip user filtering or include all if strictly checking interaction
            // Let's hide incomes if filtering by specific user unless we add 'createdBy' field later.
            // Current assumption: "Filter Activity by User" implies seeing WHAT THAT USER DID (Expenses).
            all = all.filter(a => a.type === 'expense' && a.userMatch === userFilter)
        }

        // 5. Sort by Date Descending
        return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    }, [expenses, incomes, projects, projectFilter, userFilter, isAdmin])

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t.dashboard.activity_feed}
                </h3>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:min-w-[140px]">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 bg-background/50 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8 appearance-none"
                        >
                            <option value="all">{t.dashboard.filters.all_projects}</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="relative flex-1 sm:min-w-[120px]">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 bg-background/50 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8 appearance-none"
                        >
                            <option value="all">{t.dashboard.filters.all_users}</option>
                            {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {activities.length > 0 ? (
                    activities.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                                    item.type === 'income'
                                        ? "bg-green-500/10 border-green-500/20 text-green-500"
                                        : "bg-red-500/10 border-red-500/20 text-red-500"
                                )}>
                                    {item.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {item.date}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className="truncate max-w-[120px]">{item.subtitle}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("font-bold text-sm",
                                    item.type === 'income' ? "text-green-500" : "text-foreground"
                                )}>
                                    {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString()}
                                </p>
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border capitalize",
                                    item.status === 'Paid' || item.status === 'Invoiced' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                        item.status === 'Pending' || item.status === 'Sent' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                            "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                )}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <Filter className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">{t.dashboard.no_activity}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
