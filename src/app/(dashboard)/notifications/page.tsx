"use client"

import { useNotifications } from "@/context/notification-context"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Bell, Check, Trash2, Calendar, FileText, AlertTriangle, CheckCircle, Info, Settings } from "lucide-react"
import Link from "next/link"
import { format, isToday, isYesterday } from "date-fns"

export default function NotificationsPage() {
    const { t } = useTranslation()
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications()
    const { users } = useProjects()

    // Group notifications by date
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const date = new Date(notification.date)
        let key = "Earlier"

        if (isToday(date)) {
            key = "Today"
        } else if (isYesterday(date)) {
            key = "Yesterday"
        }

        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(notification)
        return acc
    }, {} as Record<string, typeof notifications>)

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle className="w-5 h-5 text-green-500" />
            case "warning": return <AlertTriangle className="w-5 h-5 text-orange-500" />
            case "error": return <AlertTriangle className="w-5 h-5 text-red-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const translateGroup = (group: string) => {
        switch (group) {
            case "Today": return t.notifications.tabs.today
            case "Yesterday": return t.notifications.tabs.yesterday
            case "Earlier": return t.notifications.tabs.earlier
            default: return group
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary font-sans flex items-center gap-2">
                        <Bell className="w-8 h-8" />
                        {t.notifications.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t.notifications.stay_updated}</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/settings?tab=notifications"
                        className="flex items-center justify-center p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        {t.notifications.mark_all_read}
                    </button>
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t.notifications.clear}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border border-white/5">
                        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-muted-foreground">{t.notifications.no_notifications}</h3>
                        <p className="text-sm text-muted-foreground/60">{t.notifications.caught_up}</p>
                    </div>
                ) : (
                    ["Today", "Yesterday", "Earlier"].map(group => {
                        const groupNotifications = groupedNotifications[group]
                        if (!groupNotifications?.length) return null

                        return (
                            <div key={group} className="space-y-3">
                                <h3 className="text-sm font-medium text-muted-foreground px-1">{translateGroup(group)}</h3>
                                <div className="space-y-2">
                                    {groupNotifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`relative group flex gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${notification.read
                                                ? "bg-background/40 border-white/5 opacity-70 hover:opacity-100"
                                                : "bg-background/80 border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40"
                                                }`}
                                        >
                                            {!notification.read && (
                                                <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
                                            )}

                                            <div className={`mt-1 p-2 rounded-xl h-fit ${notification.type === 'success' ? 'bg-green-500/10' :
                                                notification.type === 'warning' ? 'bg-orange-500/10' :
                                                    notification.type === 'error' ? 'bg-red-500/10' :
                                                        'bg-blue-500/10'
                                                }`}>
                                                {getIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start pr-4">
                                                    <h4 className={`font-medium text-base ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                        {format(new Date(notification.date), "HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {(() => {
                                                        if (notification.creatorId) {
                                                            const creator = users.find(u => u.id === notification.creatorId)
                                                            if (creator) {
                                                                return notification.message.replace(/by .*/, `by ${creator.name}`)
                                                            }
                                                        }
                                                        return notification.message
                                                    })()}
                                                </p>
                                                {notification.link && (
                                                    <div className="pt-2">
                                                        <Link
                                                            href={notification.link}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {t.notifications.view_details} →
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
