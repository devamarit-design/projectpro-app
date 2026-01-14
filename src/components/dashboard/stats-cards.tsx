import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, CreditCard, Activity } from "lucide-react"

const stats = [
    {
        title: "Total Revenue",
        value: "฿2,450,000",
        change: "+20.1% from last month",
        icon: DollarSign,
        trend: "up"
    },
    {
        title: "Total Expenses",
        value: "฿1,235,000",
        change: "+4.5% from last month",
        icon: CreditCard,
        trend: "down"
    },
    {
        title: "Net Profit",
        value: "฿1,215,000",
        change: "+12.2% from last month",
        icon: Wallet,
        trend: "up"
    },
    {
        title: "Active Projects",
        value: "12",
        change: "+2 new this month",
        icon: Activity,
        trend: "neutral"
    }
]

export function StatsCards() {
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
                            {stat.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                            {stat.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                            {stat.change}
                        </p>
                    </div>
                </div>
            ))}
        </>
    )
}
