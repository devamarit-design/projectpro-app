"use client"

import { useTranslation } from "@/lib/i18n-context"
import { CheckCircle2, DollarSign, FileText, Calendar, Clock, ArrowRight, Wallet, HardHat } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export type ActivityType = "task" | "expense" | "income" | "project" | "other"

export interface ActivityItem {
    id: string
    type: ActivityType
    title: string
    description: string
    date: string
    amount?: string
    status?: string
    link?: string
    metadata?: any
}

interface UserActivityFeedProps {
    activities: ActivityItem[]
}

export function UserActivityFeed({ activities }: UserActivityFeedProps) {
    const { t } = useTranslation()

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case "task": return <CheckCircle2 className="w-5 h-5 text-blue-500" />
            case "expense": return <DollarSign className="w-5 h-5 text-red-500" />
            case "income": return <Wallet className="w-5 h-5 text-green-500" />
            case "project": return <HardHat className="w-5 h-5 text-orange-500" />
            default: return <FileText className="w-5 h-5 text-slate-500" />
        }
    }

    const getBgColor = (type: ActivityType) => {
        switch (type) {
            case "task": return "bg-blue-500/10 border-blue-500/20"
            case "expense": return "bg-red-500/10 border-red-500/20"
            case "income": return "bg-green-500/10 border-green-500/20"
            case "project": return "bg-orange-500/10 border-orange-500/20"
            default: return "bg-slate-500/10 border-slate-500/20"
        }
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No activity yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Activity Timeline
                </h3>
                <button
                    onClick={() => {
                        // CSV Export Logic
                        const headers = ["ID", "Type", "Date", "Title", "Description", "Amount", "Status"]
                        const rows = activities.map(item => [
                            item.id,
                            item.type,
                            new Date(item.date).toLocaleString(),
                            `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
                            `"${item.description.replace(/"/g, '""')}"`,
                            item.amount || "",
                            item.status || ""
                        ])

                        const csvContent = [
                            headers.join(","),
                            ...rows.map(row => row.join(","))
                        ].join("\n")

                        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement("a")
                        link.setAttribute("href", url)
                        link.setAttribute("download", `activity_log_${new Date().toISOString().split('T')[0]}.csv`)
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                    }}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Download as CSV"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Export CSV
                </button>
            </div>

            <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                {activities.map((item, index) => (
                    <div key={item.id || index} className="relative animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Timeline Dot */}
                        <div className={cn(
                            "absolute -left-[34px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background",
                            getBgColor(item.type)
                        )}>
                            {getIcon(item.type)}
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border",
                                        getBgColor(item.type).replace('bg-', 'text-').replace('/10', '') // Hacky but works for consistent colors
                                    )}>
                                        {item.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                {item.amount && (
                                    <span className={cn(
                                        "font-bold font-mono",
                                        item.type === 'expense' ? "text-red-500" :
                                            item.type === 'income' ? "text-green-500" : "text-foreground"
                                    )}>
                                        {item.type === 'expense' ? '-' : '+'}{item.amount}
                                    </span>
                                )}
                            </div>

                            <h4 className="font-bold text-base mb-1">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>

                            {item.link && (
                                <Link href={item.link} className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3 hover:underline">
                                    View Details <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}

                            {item.status && (
                                <div className="mt-3 inline-block px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                                    Status: {item.status}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
