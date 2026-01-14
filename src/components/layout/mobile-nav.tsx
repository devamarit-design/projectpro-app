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
    Briefcase
} from "lucide-react"

import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"
import { useProjects } from "@/context/project-context"
import { hasPermission } from "@/lib/permissions"

export function MobileNav() {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { currentUser } = useProjects()
    const [showAddMenu, setShowAddMenu] = React.useState(false)
    const [showMoreMenu, setShowMoreMenu] = React.useState(false)
    const [showFinanceMenu, setShowFinanceMenu] = React.useState(false)
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

    const financeItems = [
        { href: "/income", label: t.finance.income, icon: TrendingUp, color: "text-green-500 from-green-500/20 to-green-500/5" },
        { href: "/expenses", label: t.finance.expense, icon: TrendingDown, color: "text-red-500 from-red-500/20 to-red-500/5" },
    ]

    const moreItems = [
        { href: "/", label: t.navbar.home, icon: LayoutDashboard, color: "text-emerald-500 from-emerald-500/20 to-emerald-500/5" },
        { href: "/tasks", label: t.common.tasks, icon: CheckSquare, color: "text-blue-500 from-blue-500/20 to-blue-500/5" },
        { href: "/customers", label: t.common.customers, icon: Users, color: "text-orange-500 from-orange-500/20 to-orange-500/5" },
        { href: "/profile", label: t.common.profile, icon: User, color: "text-rose-500 from-rose-500/20 to-rose-500/5" },
        { href: "/storage", label: t.common.storage, icon: HardDrive, color: "text-indigo-500 from-indigo-500/20 to-indigo-500/5" },
        { href: "/contracts", label: t.common.contracts, icon: FileText, color: "text-amber-500 from-amber-500/20 to-amber-500/5" },
        ...(hasPermission(currentUser, "USER_CREATE") ? [{
            href: "/team",
            label: t.common.team,
            icon: Briefcase,
            color: "text-purple-500 from-purple-500/20 to-purple-500/5"
        }] : []),
        { href: "/partners", label: t.common.partners, icon: Handshake, color: "text-cyan-500 from-cyan-500/20 to-cyan-500/5" },
        { href: "/settings", label: t.common.settings, icon: Settings, color: "text-gray-500 from-gray-500/20 to-gray-500/5" },
    ]

    const addItems = [
        { href: "/income?action=new", label: t.finance.income, icon: FileText, color: "text-green-500 from-green-500/20 to-green-500/5" },
        { href: "/expenses?action=new", label: t.finance.expense, icon: CreditCard, color: "text-red-500 from-red-500/20 to-red-500/5" },
        { href: "/tasks?action=new", label: t.common.tasks, icon: CheckSquare, color: "text-blue-500 from-blue-500/20 to-blue-500/5" },
        { href: "/storage?action=new", label: "Media", icon: HardDrive, color: "text-purple-500 from-purple-500/20 to-purple-500/5" },
    ]

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
                    <div
                        className="w-full max-w-sm bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 animate-in slide-in-from-bottom-10 zoom-in-95 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold">{t.navbar.more_utils}</h3>
                            <button onClick={() => setShowMoreMenu(false)} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {moreItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={() => setShowMoreMenu(false)}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105 group-active:scale-95",
                                        item.color
                                    )}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav - 5 Items: Home, Project, Add, Finance, More */}
            <nav
                className={cn(
                    "fixed bottom-4 left-4 right-4 z-40 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl md:hidden block pb-2 pt-2 transition-transform duration-300",
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
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                            <Plus className="w-6 h-6" />
                        </div>
                    </button>

                    {/* 4. Finance (Expense + Income) */}
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

