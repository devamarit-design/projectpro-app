"use client"

import * as React from "react"
import { Search, Plus, Shield, Mail, Phone, MoreHorizontal, Trash2, Edit, Link as LinkIcon, Copy, Check } from "lucide-react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useProjects, User } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { useTranslation } from "@/lib/i18n-context"
import Link from "next/link"

// Components
import AddUserDialog from "./add-user-dialog"
import EditTeamDialog from "./edit-team-dialog"
import InviteMemberDialog from "./invite-member-dialog"
import CreateTeamDialog from "./create-team-dialog"


export default function TeamPage() {
    const { users, deleteUser, currentUser, teams, currentTeam, switchTeam, addTeam, updateUser } = useProjects()
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [showRoleGuide, setShowRoleGuide] = React.useState(false)


    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<User | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<User | null>(null)
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
    const [isEditTeamOpen, setIsEditTeamOpen] = React.useState(false)
    const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false)
    const [isInviteOpen, setIsInviteOpen] = React.useState(false)


    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest('.action-menu-trigger')) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [openMenuId])


    // Filtered Data
    const displayUsers = React.useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [users, searchQuery])

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setIsAddOpen(true)
    }

    const handleDelete = () => {
        if (showDeleteConfirm) {
            deleteUser(showDeleteConfirm.id)
            setShowDeleteConfirm(null)
        }
    }

    const [inviteLink, setInviteLink] = React.useState("")
    const [isCopied, setIsCopied] = React.useState(false)

    const handleInvite = () => {
        setIsInviteOpen(true)
    }


    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t.team.title}</h1>
                    <p className="text-muted-foreground">{t.team.subtitle}</p>
                </div>



                {/* Team Switcher & Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg text-lg overflow-hidden">
                            {(currentTeam?.logo && (currentTeam.logo.startsWith('http') || currentTeam.logo.startsWith('data:'))) ? (
                                <img src={currentTeam.logo} alt="Team Logo" className="w-full h-full object-cover" />
                            ) : (
                                currentTeam?.logo || '🏢'
                            )}
                        </div>
                        <select
                            value={currentTeam?.id || ""}
                            onChange={(e) => switchTeam(e.target.value)}
                            className="bg-transparent font-bold text-sm focus:outline-none cursor-pointer pr-8 py-1"
                        >
                            {teams.map(team => (
                                <option key={team.id} value={team.id} className="text-foreground bg-background">
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasPermission(currentTeam?.role, "COMPANY_UPDATE") && (
                        <>
                            <button
                                onClick={() => setIsCreateTeamOpen(true)}
                                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                                title="Create New Team"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            {/* Edit Team Button */}
                            <button
                                onClick={() => setIsEditTeamOpen(true)}
                                className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors border border-border"
                                title="Edit Team Details"
                            >
                                <Edit className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </>
                    )}
                </div>

                <div className="flex-1"></div>
                {hasPermission(currentTeam?.role, "USER_CREATE") && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleInvite}
                            className="flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:translate-y-0.5 transition-all active:scale-95"
                        >
                            {isCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                            {isCopied ? "Copied!" : "Invite Link"}
                        </button>
                        <button
                            onClick={() => {
                                setEditingUser(null)
                                setIsAddOpen(true)
                            }}
                            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 hover:translate-y-0.5 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {t.team.add_member}
                        </button>
                    </div>
                )}
            </div>



            {/* Role Guide */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                    onClick={() => setShowRoleGuide(!showRoleGuide)}
                    className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-bold text-sm">Role & Permissions Guide</span>
                    </div>
                    {showRoleGuide ? <Check className="w-4 h-4 rotate-180 transition-transform" /> : <div className="text-xs text-muted-foreground">Show Details</div>}
                </button>
                {showRoleGuide && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-card text-sm animate-in slide-in-from-top-2">
                        <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 space-y-1">
                            <div className="font-bold text-orange-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Owner
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">Full access. Can manage billing, delete team, and assign roles.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 space-y-1">
                            <div className="font-bold text-purple-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" /> Admin
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">Can manage members, projects, and settings. Cannot delete Owner.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-1">
                            <div className="font-bold text-blue-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" /> Manager
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">Can add projects, manage expenses, and view reports.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1">
                            <div className="font-bold text-green-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" /> Staff / Accountant
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">Can view projects and add expenses. Accountants see financial data.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl p-2 -mx-2 rounded-xl flex gap-3 border border-border/50 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t.team.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border-none rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayUsers.map(user => (
                    <Link href={`/team/detail?userId=${user.id}`} key={user.id} className="block group">
                        <div className="bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 h-full relative">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner",
                                        user.role === 'Admin' || user.role === 'Owner' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base group-hover:text-primary transition-colors">{user.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {/* Role Selector for Owner, Static for others */}
                                            {currentTeam?.role === 'Owner' && user.role !== 'Owner' ? (
                                                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="relative group/select">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => {
                                                            const newRole = e.target.value;
                                                            // @ts-ignore
                                                            if (updateUser) updateUser(user.id, { role: newRole });
                                                        }}
                                                        className="appearance-none bg-transparent pl-2 pr-6 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-muted/50 transition-colors border-dashed border-primary/50 text-primary"
                                                    >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Accountant">Accountant</option>
                                                        <option value="Staff">Staff</option>
                                                    </select>
                                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50">
                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                                    user.role === 'Admin' || user.role === 'Owner'
                                                        ? "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900"
                                                        : "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900"
                                                )}>
                                                    {user.role}
                                                </span>
                                            )}

                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                user.status === 'Active' ? "bg-green-500" :
                                                    user.status === 'Pending' ? "bg-orange-500" : "bg-gray-300"
                                            )} title={user.status} />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Dropdown / Buttons */}
                                <div className="relative z-10">
                                    {(hasPermission(currentTeam?.role, "USER_UPDATE") || (hasPermission(currentTeam?.role, "USER_DELETE") && user.role !== 'Owner')) && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault() // Prevent navigation
                                                e.stopPropagation()
                                                setOpenMenuId(openMenuId === user.id ? null : user.id)
                                            }}
                                            className="action-menu-trigger p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* Custom Dropdown */}
                                    {openMenuId === user.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1">
                                                {hasPermission(currentUser, "USER_UPDATE") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setOpenMenuId(null)
                                                            handleEdit(user)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        {t.common.edit}
                                                    </button>
                                                )}
                                                {hasPermission(currentUser, "USER_DELETE") && user.role !== 'Owner' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setOpenMenuId(null)
                                                            setShowDeleteConfirm(user)
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        {t.common.delete}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>


                            </div>

                            <div className="mt-4 space-y-2">
                                {user.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span className="font-mono">{user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}

                {displayUsers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{t.team.empty}</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <AddUserDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                initialData={editingUser}
            />

            {/* Edit Team Dialog */}
            {
                currentTeam && (
                    <EditTeamDialog
                        isOpen={isEditTeamOpen}
                        onClose={() => setIsEditTeamOpen(false)}
                        team={currentTeam}
                    />
                )
            }

            {/* Create Team Dialog */}
            <CreateTeamDialog
                isOpen={isCreateTeamOpen}
                onClose={() => setIsCreateTeamOpen(false)}
            />

            {/* Delete Confirmation */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
                        <div className="relative bg-card border border-border p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold">{t.team.confirm_remove.title}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {t.team.confirm_remove.message} <span className="text-foreground font-bold">{showDeleteConfirm.name}</span>?
                                    <br />{t.team.confirm_remove.warning}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl font-medium hover:bg-muted transition-colors"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {t.common.remove}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            <AddUserDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                initialData={editingUser}
            />
            <InviteMemberDialog
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />
        </div >
    )
}
