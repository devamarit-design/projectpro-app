import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, CreditCard, Activity } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"

export function StatsCards() {
    const { t } = useTranslation()
    const { expenses, incomes, projects } = useProjects()

    // 1. Calculate Total Revenue (Paid or Invoiced Incomes - Invoices only)
    const totalRevenue = incomes
        .filter(i => i.type === 'Invoice' && (i.status === 'Paid' || i.status === 'Accepted' || i.status === 'Invoiced'))
        .reduce((sum, i) => sum + (i.grandTotal || 0), 0)

    // 2. Calculate Total Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.totalValue || 0), 0)

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses

    // 4. Active Projects
    const activeProjects = projects.filter(p => p.status === 'In Progress').length

    // Helper: Format Currency
    const formatCurrency = (val: number) => {
        return "฿" + val.toLocaleString()
    }

    const stats = [
        {
            title: t.dashboard.total_revenue,
            value: formatCurrency(totalRevenue),
            // change: "+20.1% from last month", // TODO: Implement historic comparison later
            change: t.dashboard.stats?.revenue_desc || "Total Recognized Revenue",
            icon: DollarSign,
            trend: "up" as const,
            trendColor: "text-green-500"
        },
        {
            title: t.dashboard.total_expenses,
            value: formatCurrency(totalExpenses),
            // change: "+4.5% from last month",
            change: t.dashboard.stats?.expenses_desc || "Total Recorded Expenses",
            icon: CreditCard,
            trend: "down" as const,
            trendColor: "text-red-500"
        },
        {
            title: t.dashboard.net_profit,
            value: formatCurrency(netProfit),
            // change: "+12.2% from last month",
            change: netProfit >= 0 ? (t.dashboard.stats?.profit_healthy || "Healthy Profit") : (t.dashboard.stats?.profit_loss || "Loss"),
            icon: Wallet,
            trend: netProfit >= 0 ? "up" as const : "down" as const,
            trendColor: netProfit >= 0 ? "text-green-500" : "text-red-500"
        },
        {
            title: t.dashboard.active_projects,
            value: activeProjects.toString(),
            change: t.dashboard.stats?.progress_desc || "Currently In Progress",
            icon: Activity,
            trend: "neutral" as const,
            trendColor: "text-blue-500"
        }
    ]

    return (
        <>
            {stats.map((stat, index) => (
                <div key={index} className="min-w-[280px] sm:min-w-0 p-6 glass-card rounded-xl">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{stat.title}</h3>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {stat.trend === 'up' && <ArrowUpRight className={`h-4 w-4 ${stat.trendColor}`} />}
                            {stat.trend === 'down' && <ArrowDownRight className={`h-4 w-4 ${stat.trendColor}`} />}
                            {stat.change}
                        </p>
                    </div>
                </div>
            ))}
        </>
    )
}
