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
    Briefcase,
    UserPlus
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/context/organization-context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createPortal } from "react-dom"

export function HeaderProfile() {
    const { currentUser, setCurrentUser, teams, currentTeam, switchTeam, addTeam } = useProjects()
    const { joinOrganizationByCode } = useOrganization()
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = React.useState(false)
    const [isJoining, setIsJoining] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [position, setPosition] = React.useState({ top: 0, right: 0 })
    const [hasImageError, setHasImageError] = React.useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)

    // Reset error when avatar changes
    React.useEffect(() => {
        setHasImageError(false)
    }, [currentUser?.avatar])

    // Close dropdown when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    if (!currentUser) return null

    const { logout } = useProjects()
    // ...
    const handleLogoutConfirm = async () => {
        await logout()
        window.location.href = "/login"
    }

    const handleCreateTeam = () => {
        const name = window.prompt("Enter new team name:")
        if (name) {
            addTeam(name)
        }
    }

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            })
        }
        setIsOpen(!isOpen)
    }

    const DropdownContent = (
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: position.top,
                right: position.right,
                zIndex: 9999
            }}
            className="w-72 bg-popover border border-border rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200"
        >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/20">
                <p className="font-bold text-sm truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                    {currentUser.email}
                    {currentTeam?.role && (
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                            {currentTeam.role}
                        </span>
                    )}
                </p>
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
                <button
                    onClick={async () => {
                        const code = window.prompt("Enter Team Code or Invite Code:")
                        if (code && code.trim()) {
                            setIsJoining(true)
                            try {
                                const teamName = await joinOrganizationByCode(code.trim())
                                alert(`Successfully joined team: ${teamName}`)
                                window.location.reload() // Reload to refresh team list
                            } catch (e: any) {
                                alert(e.message || "Failed to join team. Please check the code and try again.")
                            } finally {
                                setIsJoining(false)
                            }
                        }
                        setIsOpen(false)
                    }}
                    disabled={isJoining}
                    className="w-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                    <UserPlus className="w-3 h-3" />
                    {isJoining ? "Joining..." : "Join Team"}
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
                    onClick={() => {
                        setIsOpen(false)
                        setShowLogoutConfirm(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>
        </div>
    )

    return (
        <>
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="ออกจากระบบ"
                message="คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
                confirmText="ออกจากระบบ"
                cancelText="ยกเลิก"
                variant="danger"
            />
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative">
                    {currentUser.avatar && !hasImageError ? (
                        <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={() => setHasImageError(true)}
                        />
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
            {isOpen && typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
        </>
    )
}
