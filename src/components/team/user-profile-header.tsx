"use client"

import { User } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Mail, Phone, MapPin, Calendar, Edit, Star, Shield, CheckCircle2, DollarSign, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface UserProfileHeaderProps {
    user: User
    stats: {
        completedTasks: number
        activeProjects: number
        totalExpenses: string
    }
    onEdit?: () => void
    isCurrentUserOrAdmin: boolean
}

export function UserProfileHeader({ user, stats, onEdit, isCurrentUserOrAdmin }: UserProfileHeaderProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            {/* Main Profile Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex flex-col gap-6 items-center relative z-10 text-center">
                    {/* Avatar & Status */}
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                            {user.avatar ? (
                                <Image src={user.avatar} alt={user.name} fill sizes="128px" className="object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-primary">{user.name.charAt(0)}</span>
                            )}
                            <div className={cn(
                                "absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-background shadow-lg",
                                user.status === 'Active' ? "bg-green-500" :
                                    user.status === 'Pending' ? "bg-orange-500" : "bg-gray-400"
                            )} />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                user.status === 'Active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                    user.status === 'Pending' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                        "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            )}>
                                {user.status}
                            </span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full space-y-6 flex flex-col items-center">
                        <div className="flex flex-col items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">{user.name}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="font-medium">{user.role}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-sm">Member since {new Date(user.joinedDate || Date.now()).getFullYear()}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {user.rating || "5.0"} Rating
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                            <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group min-w-[200px]">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Email</p>
                                    <p className="text-sm font-medium truncate">{user.email || "No email"}</p>
                                </div>
                            </a>
                            <a href={`tel:${user.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group min-w-[200px]">
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Phone</p>
                                    <p className="text-sm font-medium truncate">{user.phone || "No phone"}</p>
                                </div>
                            </a>
                        </div>

                        {isCurrentUserOrAdmin && onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 mt-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold font-sans">{stats.completedTasks}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Completed Tasks</p>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <FolderKanban className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold font-sans">{stats.activeProjects}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Projects</p>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold font-sans">{stats.totalExpenses}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Expenses Claimed</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
