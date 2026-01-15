"use client"

import * as React from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import {
    User,
    LogOut,
    Settings,
    ChevronDown,
    Plus,
    Check,
    Building2,
    Briefcase
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function HeaderProfile() {
    const { currentUser, setCurrentUser, teams, currentTeam, switchTeam, addTeam } = useProjects()
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (!currentUser) return null

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            setCurrentUser(null)
            window.location.href = "/"
        }
    }

    const handleCreateTeam = () => {
        const name = window.prompt("Enter new team name:")
        if (name) {
            addTeam(name)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                    {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        currentUser.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="hidden md:block text-left mr-1">
                    <p className="text-xs font-bold leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-none mt-1">{currentTeam?.name || "No Team"}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl py-2 z-[200] animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-border bg-muted/20">
                        <p className="font-bold text-sm truncate">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email || currentUser.role}</p>
                    </div>

                    {/* Team Switcher Section */}
                    <div className="py-2">
                        <div className="px-4 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Teams</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {teams.length}
                            </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {teams.map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => {
                                        switchTeam(team.id)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left group",
                                        currentTeam?.id === team.id && "bg-primary/5 border-l-2 border-primary"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                                        {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('data:')) ? (
                                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                        ) : (
                                            team.logo || "🏢"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-medium", currentTeam?.id === team.id && "text-primary")}>
                                            {team.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{team.role}</p>
                                    </div>
                                    {currentTeam?.id === team.id && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCreateTeam}
                            className="w-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Create New Team
                        </button>
                    </div>

                    <div className="h-px bg-border my-1" />

                    {/* Menu Items */}
                    <div className="px-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                            <User className="w-4 h-4" />
                            Profile Settings
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
