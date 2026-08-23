"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    CheckSquare,
    Plus,
    CreditCard,
    MoreHorizontal,
    FolderKanban,
    FileText,
    HardDrive,
    Users,
    Settings,
    X,
    Wallet,
    TrendingUp,
    TrendingDown,
    User,
    Handshake,
    Briefcase,
    Globe,
    LogOut,
    CalendarDays,
    Archive,
    Info,
    ShieldCheck,
    Gamepad2,
    Megaphone,
    Newspaper,
    GanttChartSquare
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission } from "@/lib/permissions"

export function MobileNav() {
    const pathname = usePathname()
    const { t, locale, setLocale } = useTranslation()
    const { currentUser, logout, currentTeam } = useProjects()
    const [showAddMenu, setShowAddMenu] = React.useState(false)
    const [showMoreMenu, setShowMoreMenu] = React.useState(false)
    const [showFinanceMenu, setShowFinanceMenu] = React.useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)
    const scrollDirection = useScrollDirection()

    // Main 4 Items: Finance, Add, Project, More

    const toggleAddMenu = () => {
        setShowAddMenu(!showAddMenu)
        setShowMoreMenu(false)
        setShowFinanceMenu(false)
    }

    const toggleMoreMenu = () => {
        setShowMoreMenu(!showMoreMenu)
        setShowAddMenu(false)
        setShowFinanceMenu(false)
    }

    const toggleFinanceMenu = () => {
        setShowFinanceMenu(!showFinanceMenu)
        setShowAddMenu(false)
        setShowMoreMenu(false)
    }

    const financeItems = React.useMemo(() => [
        ...(hasPermission(currentTeam?.role, "INCOME_CREATE") ? [{ href: "/income", label: t.finance.income, icon: TrendingUp, color: "text-green-500 from-green-500/20 to-green-500/5" }] : []),
        { href: "/expenses", label: t.finance.expense, icon: TrendingDown, color: "text-red-500 from-red-500/20 to-red-500/5" },
    ], [currentTeam?.role, t.finance.income, t.finance.expense])

    const moreGroups = React.useMemo(() => [
        {
            title: "เอกสาร", // Documents
            items: [
                { href: "/contracts", label: t.common.contracts, icon: FileText, color: "text-amber-500 bg-amber-500/10" },
            ]
        },
        {
            title: "ข้อมูล", // Data
            items: [
                { href: "/customers", label: t.common.customers, icon: Users, color: "text-orange-500 bg-orange-500/10" },
                { href: "/partners", label: t.common.partners, icon: Handshake, color: "text-cyan-500 bg-cyan-500/10" },
            ]
        },
        {
            title: "ทีม", // Team
            items: [
                { href: "/profile", label: t.common.profile, icon: User, color: "text-rose-500 bg-rose-500/10" },
                ...(hasPermission(currentTeam?.role, "TEAM_VIEW") ? [{
                    href: "/team",
                    label: t.common.team,
                    icon: Briefcase,
                    color: "text-purple-500 bg-purple-500/10"
                }] : []),
                { href: "/announcements", label: "ประกาศ", icon: Megaphone, color: "text-yellow-500 bg-yellow-500/10" },
                { href: "/wall", label: "Team Wall", icon: Newspaper, color: "text-pink-500 bg-pink-500/10" },
            ]
        },
        {
            title: "อื่นๆ", // Other
            items: [
                { href: "/settings", label: t.common.settings, icon: Settings, color: "text-gray-500 bg-gray-500/10" },
                { href: "/about", label: t.navbar.about, icon: Info, color: "text-blue-500 bg-blue-500/10" },
                { href: "/policy", label: t.navbar.policy, icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10" },
                { href: "/bored", label: t.navbar.bored, icon: Gamepad2, color: "text-indigo-500 bg-indigo-500/10" },
            ]
        }
    ], [currentTeam?.role, t])

    const addItems = React.useMemo(() => [
        ...(hasPermission(currentTeam?.role, "INCOME_CREATE") ? [{ href: "/income?action=new", label: t.finance.income, icon: FileText, color: "text-green-500 from-green-500/20 to-green-500/5" }] : []),
        { href: "/expenses?action=new", label: t.finance.expense, icon: CreditCard, color: "text-red-500 from-red-500/20 to-red-500/5" },
        // { href: "/storage?action=new", label: "Media", icon: HardDrive, color: "text-purple-500 from-purple-500/20 to-purple-500/5" },
        { href: "/wall?action=new", label: "Post", icon: Newspaper, color: "text-pink-500 from-pink-500/20 to-pink-500/5" },
    ], [currentTeam?.role, t])

    const isFinanceActive = pathname === "/income" || pathname === "/expenses"

    return (
        <>
            {/* Finance Menu Overlay */}
            {showFinanceMenu && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 flex items-end pb-24 px-4 justify-center" onClick={() => setShowFinanceMenu(false)}>
                    <div
                        className="w-full max-w-xs bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 animate-in slide-in-from-bottom-10 zoom-in-95 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{t.navbar.finance}</h3>
                            <button onClick={() => setShowFinanceMenu(false)} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {financeItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={() => setShowFinanceMenu(false)}
                                    className="flex flex-col items-center gap-3 group p-4 rounded-2xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105 group-active:scale-95",
                                        item.color
                                    )}>
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Menu Overlay */}
            {showAddMenu && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 flex items-end pb-24 px-4 justify-center" onClick={() => setShowAddMenu(false)}>
                    <div
                        className="w-full max-w-sm bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 animate-in slide-in-from-bottom-10 zoom-in-95 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold">{t.navbar.quick_add}</h3>
                            <button onClick={() => setShowAddMenu(false)} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {addItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={() => setShowAddMenu(false)}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105 group-active:scale-95",
                                        item.color
                                    )}>
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 flex items-end pb-24 px-4 justify-center" onClick={() => setShowMoreMenu(false)}>
                    <ConfirmDialog
                        isOpen={showLogoutConfirm}
                        onClose={() => setShowLogoutConfirm(false)}
                        onConfirm={async () => {
                            await logout()
                            window.location.href = "/login"
                        }}
                        title="ออกภจากระบบ"
                        message="คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
                        confirmText="ออกจากระบบ"
                        cancelText="ยกเลิก"
                        variant="danger"
                    />
                    <div
                        className="w-full max-w-sm bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 animate-in slide-in-from-bottom-10 zoom-in-95 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-xl z-20 pb-2">
                            <h3 className="text-lg font-black">{t.navbar.more_utils}</h3>
                            <button onClick={() => setShowMoreMenu(false)} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {moreGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap opacity-70">{group.title}</h4>
                                    <div className="h-px w-full bg-white/10" />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {group.items.map((item, index) => (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            onClick={() => setShowMoreMenu(false)}
                                            className="flex flex-col items-center gap-1.5 group p-1"
                                        >
                                            <div className={cn(
                                                "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 group-active:scale-95",
                                                item.color
                                            )}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] font-normal text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight line-clamp-1 w-full overflow-hidden text-ellipsis px-0.5">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* App Settings Section (Mobile Only) */}
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">{t.common.settings}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Language Toggle */}
                                <button
                                    onClick={() => {
                                        setLocale(locale === 'en' ? 'th' : 'en')
                                        // Don't close menu immediately so they can see change
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-muted-foreground">Language</div>
                                        <div className="font-bold">{locale.toUpperCase()}</div>
                                    </div>
                                </button>

                                {/* Theme Toggle */}
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5 hover:bg-muted/50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                        <ThemeToggle mobile />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-muted-foreground">Theme</div>
                                        <div className="font-bold">Auto</div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Logout Button */}
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav - 5 Items: Home, Project, Add, Finance, More */}
            <nav
                className={cn(
                    "fixed bottom-4 left-4 right-4 z-40 bg-background/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl md:hidden block pb-2 pt-2 transition-transform duration-300",
                    scrollDirection === "down" ? "translate-y-24" : "translate-y-0"
                )}
            >
                <div className="flex items-center justify-around h-14 px-2">
                    {/* 1. Home */}
                    <Link
                        href="/"
                        className={cn(
                            "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative",
                            pathname === "/" ? "text-primary scale-110" : "text-muted-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px]">{t.navbar.home}</span>
                    </Link>

                    {/* 2. Projects */}
                    <Link
                        href="/projects"
                        className={cn(
                            "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative",
                            pathname === "/projects" ? "text-primary scale-110" : "text-muted-foreground"
                        )}
                    >
                        <FolderKanban className="w-5 h-5" />
                        <span className="text-[10px]">{t.navbar.project}</span>
                    </Link>

                    {/* 3. Add (Center) */}
                    <button
                        onClick={toggleAddMenu}
                        className={cn(
                            "flex flex-col items-center justify-center -mt-6 p-1 rounded-full bg-background border-4 border-background transition-transform",
                            showAddMenu ? "rotate-45" : ""
                        )}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow">
                            <Plus className="w-6 h-6" />
                        </div>
                    </button>

                    {/* 4. Finance (Expense + Income) */}
                    {hasPermission(currentTeam?.role, "INCOME_CREATE") ? (
                        <button
                            onClick={toggleFinanceMenu}
                            className={cn(
                                "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative",
                                isFinanceActive || showFinanceMenu ? "text-primary scale-110" : "text-muted-foreground"
                            )}
                        >
                            <Wallet className="w-5 h-5" />
                            <span className="text-[10px]">{t.navbar.finance}</span>
                        </button>
                    ) : (
                        <Link
                            href="/expenses"
                            className={cn(
                                "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative",
                                pathname === "/expenses" ? "text-primary scale-110" : "text-muted-foreground"
                            )}
                        >
                            <CreditCard className="w-5 h-5" />
                            <span className="text-[10px]">{t.finance.expense}</span>
                        </Link>
                    )}

                    {/* 5. More */}
                    <button
                        onClick={toggleMoreMenu}
                        className={cn(
                            "flex flex-col items-center justify-center w-full space-y-1 transition-colors relative text-muted-foreground",
                            showMoreMenu ? "text-primary scale-110" : ""
                        )}
                    >
                        {showMoreMenu ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                        <span className="text-[10px]">{t.navbar.more}</span>
                    </button>
                </div>
            </nav>
        </>
    )
}

