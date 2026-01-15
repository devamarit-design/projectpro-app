"use client"

import * as React from "react"
import { Search, Plus, Shield, Mail, Phone, MoreHorizontal, Trash2, Edit } from "lucide-react"
import { useProjects, User } from "@/context/project-context"
import { cn } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { useTranslation } from "@/lib/i18n-context"

// Components
import AddUserDialog from "./add-user-dialog"
import EditTeamDialog from "./edit-team-dialog"

export default function TeamPage() {
    const { users, deleteUser, currentUser, teams, currentTeam, switchTeam, addTeam } = useProjects()
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState("")


    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<User | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<User | null>(null)
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
    const [isEditTeamOpen, setIsEditTeamOpen] = React.useState(false)

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
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg text-lg">
                            {currentTeam?.logo || '🏢'}
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

                    <button
                        onClick={() => {
                            const name = window.prompt(t.team_settings.enter_team_name)
                            if (name) {
                                // Add random mock team data (optional)
                                addTeam(name)
                            }
                        }}
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
                </div>

                <div className="flex-1"></div>
                {hasPermission(currentUser, "USER_CREATE") && (
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
                    <div key={user.id} className="group bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
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
                                    <h3 className="font-bold text-base">{user.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                            user.role === 'Admin' || user.role === 'Owner'
                                                ? "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900"
                                                : "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900"
                                        )}>
                                            {user.role}
                                        </span>
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            user.status === 'Active' ? "bg-green-500" : "bg-gray-300"
                                        )} title={user.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Actions Dropdown / Buttons */}
                            {/* Actions Dropdown / Buttons */}
                            <div className="relative">
                                {(hasPermission(currentUser, "USER_UPDATE") || (hasPermission(currentUser, "USER_DELETE") && user.role !== 'Owner')) && (
                                    <button
                                        onClick={(e) => {
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
                                                    onClick={() => {
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
                                                    onClick={() => {
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
        </div >
    )
}
