"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    CreditCard,
    CheckSquare,
    HardDrive,
    Users,
    Settings,
    Briefcase,
    LogOut,
    User,
    Handshake,
    Shield
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission } from "@/lib/permissions"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { currentUser, logout } = useProjects()

    const navItems = [
        { href: "/", label: t.common.dashboard, icon: LayoutDashboard },
        { href: "/projects", label: t.common.projects, icon: FolderKanban },
        { href: "/income", label: t.common.income, icon: FileText },
        { href: "/expenses", label: t.common.expenses, icon: CreditCard },
        { href: "/tasks", label: t.common.tasks, icon: CheckSquare },
        { href: "/storage", label: t.common.storage, icon: HardDrive },
        { href: "/contracts", label: t.common.contracts, icon: FileText }, // Added Contracts item
        { href: "/partners", label: t.common.partners, icon: Handshake },
        { href: "/team", label: t.common.team, icon: Briefcase, permission: "USER_CREATE" }, // Requires USER_CREATE permission
        { href: "/settings", label: t.common.settings, icon: Settings, permission: "COMPANY_UPDATE" }, // Requires COMPANY_UPDATE permission
    ]

    return (
        <aside className={cn("hidden md:flex flex-col w-64 h-screen bg-transparent text-sidebar-foreground", className)}>
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sidebar-primary to-purple-600 bg-clip-text text-transparent">
                    PROJECTPRO
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    // Check Permission
                    if (item.permission && !hasPermission(currentUser, item.permission as any)) {
                        return null
                    }

                    const isActive = pathname === item.href || (pathname !== "/" && pathname?.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-sidebar-primary" : "group-hover:text-sidebar-primary")} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}

            </nav>

            <div className="p-4 border-t border-sidebar-border/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {currentUser?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-sidebar-foreground">
                            {currentUser?.name || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {currentUser?.role || "Viewer"}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to sign out?")) {
                                logout();
                            }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

        </aside>
    )
}
