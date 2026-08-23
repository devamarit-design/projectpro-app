"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import {
    FolderKanban,
    Receipt,
    FileText,
    Store,
    Users,
    Settings
} from "lucide-react"

export function QuickActionsGrid() {
    const { t } = useTranslation()

    const actions = [
        {
            label: t.dashboard?.active_projects || "Projects",
            icon: FolderKanban,
            href: "/projects",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            label: t.expenses?.title || "Expenses",
            icon: Receipt,
            href: "/expenses",
            color: "text-red-500",
            bg: "bg-red-500/10"
        },
        {
            label: t.common?.customers || "Customers",
            icon: Users,
            href: "/customers",
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            label: t.settings?.menu?.documents || "Documents",
            icon: FileText,
            href: "/contracts", // Links to Contracts page
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            label: t.common?.partners || "Vendors",
            icon: Store,
            href: "/partners", // Links to Partners page
            color: "text-teal-500",
            bg: "bg-teal-500/10"
        },
        {
            label: t.settings?.title || "Settings",
            icon: Settings,
            href: "/settings",
            color: "text-slate-500",
            bg: "bg-slate-500/10"
        }
    ]

    return (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-6 gap-x-4 mb-8">
            {actions.map((action, index) => {
                const Icon = action.icon
                return (
                    <Link
                        key={index}
                        href={action.href}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`p-4 rounded-2xl ${action.bg} ${action.color} shadow-sm group-hover:shadow-md group-hover:brightness-105 transition-all duration-300`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground text-center line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
                            {action.label}
                        </span>
                    </Link>
                )
            })}
        </div>
    )
}
