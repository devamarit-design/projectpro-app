"use client"

import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, Suspense } from "react"
import { UserProfileHeader } from "@/components/team/user-profile-header"
import { UserActivityFeed, ActivityItem } from "@/components/team/user-activity-feed"
import AddUserDialog from "../add-user-dialog"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { cn } from "@/lib/utils"

function UserDetailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const userId = searchParams.get('userId')

    // Safety check - if no userId, redirect
    useEffect(() => {
        if (!userId) {
            router.push('/team')
        }
    }, [userId, router])

    const { users, currentUser, tasks, projects, expenses, incomes, currentTeam } = useProjects()
    const { t } = useTranslation()

    // State for Edit Dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    // Tabs
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview')

    // 1. Find User & Inject Context-Aware Role
    const user = useMemo(() => {
        if (!userId) return null
        let foundUser = currentUser?.id === userId ? currentUser : users.find(u => u.id === userId)

        if (foundUser && currentTeam) {
            // Derive Role from Organization Data
            const orgData = foundUser.organizations?.find(o => (typeof o === 'string' ? o : o.orgId) === currentTeam.id)
            const contextRole = orgData && typeof orgData !== 'string' ? orgData.role : null

            // Override role if we found a specific one for this team
            if (contextRole) {
                return { ...foundUser, role: contextRole }
            }
        }
        return foundUser
    }, [userId, users, currentUser, currentTeam])

    // 2. Permission Check (Optional - redirect if not allowed)
    useEffect(() => {
        if (!user && users.length > 0 && userId) {
            // User not found in list, might be loading or invalid
        }
    }, [user, users, router, userId])

    // 3. Real-time Activity Fetch
    const [userActivity, setUserActivity] = useState<ActivityItem[]>([])

    useEffect(() => {
        if (!user || !user.orgIds || user.orgIds.length === 0) return

        // Query activities where:
        // 1. It belongs to the current org (context) - optimizing for current view
        // 2. The user is involved (relatedUserIds array-contains user.id)
        // Note: Firestore requires an index for array-contains + orderBy.
        // If index is missing, it will throw an error in console with a link to create it.
        // Fallback: Client-side sort if index creation is blocked.

        // Simpler query first to avoid complex index:
        // Get last 50 activities for this org, then filter client-side for this user.
        // This is not perfectly scalable but works fine for < 1000 activities/day.
        // Better: where('relatedUserIds', 'array-contains', user.id)

        try {
            const currentOrgId = currentTeam?.id
            if (!currentOrgId) return

            // Construct Query
            const q = query(
                collection(db, "activities"),
                where("orgId", "==", currentOrgId),
                where("relatedUserIds", "array-contains", user.id),
                // orderBy("timestamp", "desc"), // Requires Index
                // limit(50)
            )

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedActivities = snapshot.docs.map(doc => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        type: data.entityType.toLowerCase(), // Convert PROJECT -> project
                        title: data.entityTitle,
                        description: data.details,
                        date: data.timestamp,
                        amount: data.metadata?.amount, // Optional
                        status: data.metadata?.status, // Optional
                        link: "", // TODO: Reconstruct link based on type/ID
                    } as ActivityItem
                })

                // Sort client-side to avoid index requirement for now
                fetchedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                setUserActivity(fetchedActivities)
            }, (error) => {
                console.error("Error fetching activities:", error)
            })

            return () => unsubscribe()

        } catch (e) {
            console.error("Setup activity listener failed", e)
        }

    }, [user, currentUser])

    // 4. Calculate Stats
    const stats = useMemo(() => {
        if (!user) return { completedTasks: 0, activeProjects: 0, totalExpenses: "฿0" }

        const userTasks = tasks.filter(t => {
            if (Array.isArray(t.assignedTo)) {
                return t.assignedTo.includes(user.id)
            }
            return t.assignedTo === user.id
        })
        const completed = userTasks.filter(t => t.status === 'Done').length

        const userExpenses = expenses.filter(e => e.paidBy === user.name || e.paidBy === user.id)
        const totalExp = userExpenses.reduce((sum, e) => sum + (e.totalValue || 0), 0)

        const involvedProjectIds = new Set(userTasks.map(t => t.projectId))
        const activeProj = projects.filter(p => involvedProjectIds.has(p.id) && p.status === 'In Progress').length

        const formattedExp = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(totalExp)

        return {
            completedTasks: completed,
            activeProjects: activeProj,
            totalExpenses: formattedExp
        }
    }, [user, tasks, expenses, projects])

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">User not found</div>
    }

    const isAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Admin'
    const isOwner = currentUser?.id === user.id

    return (
        <div className="pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Back Button */}
            <div>
                <Link href="/team" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.team.title}
                </Link>
            </div>

            <UserProfileHeader
                user={user}
                stats={stats}
                onEdit={() => setIsEditDialogOpen(true)}
                isCurrentUserOrAdmin={isAdmin || isOwner}
            />

            {/* Tabs Navigation */}
            <div className="flex justify-center border-b border-border/40 mb-8">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.team.user_detail?.tabs?.overview || 'Overview'}
                        {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'timeline' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.team.user_detail?.tabs?.activity || 'Activity Timeline'}
                        {activeTab === 'timeline' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Employment Details */}
                        <div className="p-6 rounded-2xl bg-card border border-border/50">
                            <h3 className="font-bold mb-6 opacity-90 flex items-center gap-2">
                                <span className="w-1 h-4 bg-primary rounded-full" />
                                {t.team.user_detail?.employment?.title || 'Employment Details'}
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-3 border-b border-border/40">
                                    <span className="text-muted-foreground">{t.team.user_detail?.employment?.joined_date || 'Joined Date'}</span>
                                    <span className="font-medium">{user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-border/40">
                                    <span className="text-muted-foreground">{t.team.user_detail?.employment?.employee_id || 'Employee ID'}</span>
                                    <span className="font-medium font-mono text-xs bg-muted px-2 py-1 rounded">{user.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-border/40">
                                    <span className="text-muted-foreground">Department</span>
                                    <span className="font-medium">{user.role}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-border/40">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                        user.status === 'Active' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                                    )}>{user.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Summary (Mini) */}
                        <div className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col">
                            <h3 className="font-bold mb-6 opacity-90 flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                                Recent Updates
                            </h3>
                            <div className="flex-1 space-y-4">
                                {userActivity.slice(0, 3).map((activity) => (
                                    <div key={activity.id} className="flex gap-3 items-start">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium line-clamp-1">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {userActivity.length === 0 && (
                                    <p className="text-muted-foreground text-sm">No recent activity.</p>
                                )}
                            </div>
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className="mt-6 w-full py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/20"
                            >
                                View All Activity
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <UserActivityFeed activities={userActivity} />
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <AddUserDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                initialData={user}
            />
        </div>
    )
}

export default function UserDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <UserDetailContent />
        </Suspense>
    )
}
