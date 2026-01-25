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
    Shield,
    Calendar,
    Archive,
    Info,
    ShieldCheck,
    Gamepad2,
    Megaphone,
    Newspaper
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission } from "@/lib/permissions"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { currentUser, logout, currentTeam } = useProjects()
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)

    const navGroups = [
        {
            title: "MENU",
            items: [
                { href: "/", label: t.common.dashboard, icon: LayoutDashboard },
                { href: "/projects", label: t.common.projects, icon: FolderKanban },
                { href: "/income", label: t.common.income, icon: FileText, permission: "INCOME_CREATE" },
                { href: "/expenses", label: t.common.expenses, icon: CreditCard },
            ]
        },
        {
            title: "งาน", // Work
            items: [
                { href: "/calendar", label: t.calendar?.title || "ปฏิทิน", icon: Calendar },
                { href: "/tasks", label: t.common.tasks, icon: CheckSquare },
                { href: "/contracts", label: t.common.contracts, icon: FileText },
                { href: "/storage", label: t.common.storage, icon: HardDrive },
            ]
        },
        {
            title: "ข้อมูล", // Data
            items: [
                { href: "/customers", label: t.common.customers, icon: Users },
                { href: "/partners", label: t.common.partners, icon: Handshake },
            ]
        },
        {
            title: "ทีม", // Team
            items: [
                { href: "/profile", label: t.common.profile, icon: User },
                { href: "/team", label: t.common.team, icon: Briefcase, permission: "TEAM_VIEW" },
            ]
        },
        {
            title: "อื่นๆ", // Other
            items: [
                { href: "/settings", label: t.common.settings, icon: Settings },
                { href: "/wall", label: "Team Wall", icon: Newspaper },
                { href: "/announcements", label: "ประกาศ", icon: Megaphone },
                { href: "/about", label: t.navbar.about, icon: Info },
                { href: "/policy", label: t.navbar.policy, icon: ShieldCheck },
                { href: "/bored", label: t.navbar.bored, icon: Gamepad2 },
            ]
        }
    ]

    return (
        <aside className={cn("hidden md:flex flex-col w-64 h-screen bg-transparent text-sidebar-foreground", className)}>
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={async () => {
                    await logout()
                    window.location.href = "/login"
                }}
                title="ออกจากระบบ"
                message="คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
                confirmText="ออกจากระบบ"
                cancelText="ยกเลิก"
                variant="danger"
            />
            <div className="p-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-sidebar-primary to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">
                    HIPSLOTHPROJECT
                </h1>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-0.5">
                        {groupIndex > 0 && <div className="h-px bg-sidebar-border/50 mx-2 my-1" />}
                        {group.title && (
                            <h4 className="px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1 mt-1">
                                {group.title}
                            </h4>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item: any) => {
                                // Check Permission
                                if (item.permission && !hasPermission(currentTeam?.role, item.permission as any)) {
                                    return null
                                }

                                const isActive = pathname === item.href || (pathname !== "/" && pathname?.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-sidebar-primary" : "group-hover:text-sidebar-primary")} />
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-3 border-t border-sidebar-border/50">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                            currentUser?.name?.charAt(0) || "U"
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-sidebar-foreground">
                            {currentUser?.name || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {currentTeam?.role || "Viewer"}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
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
