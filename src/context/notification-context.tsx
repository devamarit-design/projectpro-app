"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useProjects, ProjectTask, Expense } from "./project-context"
import { useSettings } from "./settings-context"
import { differenceInDays, parseISO, isPast, addDays } from "date-fns"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export type NotificationType = "info" | "success" | "warning" | "error" | "reminder"

export interface Notification {
    id: string
    title: string
    message: string
    type: NotificationType
    date: string // ISO string
    read: boolean
    link?: string
    relatedId?: string // e.g. project ID, task ID
    target?: 'all' | 'admin' | string // Audience
    orgId?: string
    creatorId?: string // Dynamic user name support
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
    addNotification: (notification: Omit<Notification, "id" | "read">) => void
    requestPushPermission: () => Promise<void>
    permissionStatus: NotificationPermission
    isPushEnabled: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Helper to generate consistent IDs for alerts
const generateAlertId = (type: string, id: string) => `alert-${type}-${id}`

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        title: "Material Delivery Arrived",
        message: "Cement bags x50 for 'Modern Office Complex' has been delivered.",
        type: "success",
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        read: false,
        link: "/projects/detail?id=1",
        relatedId: "proj-1"
    },
    {
        id: "2",
        title: "Payment Overdue",
        message: "Invoice #INV-2024-001 is overdue by 3 days.",
        type: "error",
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
        link: "/income",
        relatedId: "inv-001"
    },
    {
        id: "3",
        title: "New Task Assigned",
        message: "You have been assigned to 'Site Inspection' for Luxury Villa.",
        type: "info",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        link: "/tasks",
        relatedId: "task-101"
    },
    {
        id: "4",
        title: "Budget Warning",
        message: "Project 'Modern Office Complex' has reached 85% of budget.",
        type: "warning",
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        read: true,
        link: "/projects/detail?id=1",
        relatedId: "proj-1"
    },
    {
        id: "5",
        title: "System Update",
        message: "Platform maintenance scheduled for this Sunday.",
        type: "info",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        read: true,
    }
]

import { useTranslation } from "@/lib/i18n-context"

// Helper for string interpolation
const format = (template: string, args: Record<string, string | number>) => {
    return template.replace(/{(\w+)}/g, (_, key) => {
        return args[key] !== undefined ? String(args[key]) : `{${key}}`
    })
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { projects, expenses, contracts, currentUser, currentTeam } = useProjects()
    const { notificationSettings } = useSettings()
    const { t } = useTranslation()

    // Load read status from local storage
    const [readStatus, setReadStatus] = useState<Record<string, boolean>>({})
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')

    useEffect(() => {
        const storedReadStatus = localStorage.getItem("pp_notifications_read")
        if (storedReadStatus) {
            setTimeout(() => setReadStatus(JSON.parse(storedReadStatus)), 0)
        }

        // Check permission status on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission)
        }
    }, [])

    useEffect(() => {
        if (Object.keys(readStatus).length > 0) {
            localStorage.setItem("pp_notifications_read", JSON.stringify(readStatus))
        }
    }, [readStatus])

    const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([])

    // Load Real-time Notifications from Firestore
    useEffect(() => {
        if (!currentTeam) return

        // Simple query without orderBy to avoid composite index requirement
        const q = query(
            collection(db, "notifications"),
            where("orgId", "==", currentTeam.id),
            limit(50)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const manualNotifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[]
            // Sort client-side by date descending
            manualNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setRealtimeNotifications(manualNotifs)
        }, (error) => {
            console.warn("Notification query error:", error.message)
            setRealtimeNotifications([])
        })

        return () => unsubscribe()
    }, [currentTeam])

    const [isPushEnabled, setIsPushEnabled] = useState(false)

    // Check if we already have a token
    useEffect(() => {
        if (permissionStatus === 'granted') {
            // We could check if we have a token saved or try to get it silently
            // For now, let's assume if granted we might be enabled, or default false until confirmed
        }
    }, [permissionStatus])

    const unregisterPush = async () => {
        try {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                const { getMessaging, deleteToken } = await import("firebase/messaging")
                const { messaging } = await import("@/lib/firebase")

                if (messaging) {
                    await deleteToken(messaging)
                    setIsPushEnabled(false)
                    toast.success("Push notifications disabled")
                }
            }
        } catch (error) {
            console.error("Error disabling push:", error)
            toast.error("Failed to disable push")
        }
    }

    // Push Notifications Logic
    const requestPushPermission = async () => {
        // If already enabled, this acts as a toggle to disable
        if (isPushEnabled) {
            await unregisterPush()
            return
        }

        try {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                const promise = Notification.requestPermission()

                toast.promise(promise, {
                    loading: 'Requesting permission...',
                    success: (permission: NotificationPermission) => {
                        setPermissionStatus(permission)
                        if (permission === 'granted') return 'Notifications enabled!'
                        return 'Permission denied'
                    },
                    error: 'Failed to request permission'
                })

                const permission = await promise

                if (permission === 'granted') {
                    // Import messaging dynamically to avoid SSR issues
                    const { getMessaging, getToken, onMessage } = await import("firebase/messaging")
                    const { messaging } = await import("@/lib/firebase")

                    if (messaging) {
                        try {
                            const token = await getToken(messaging)
                            console.log("FCM Token:", token)
                            setIsPushEnabled(true)
                            toast.success("Ready to receive notifications")
                            // TODO: Save this token to Firestore for the current user

                            onMessage(messaging, (payload) => {
                                console.log('Foreground Message:', payload)
                                addNotification({
                                    title: payload.notification?.title || 'New Message',
                                    message: payload.notification?.body || '',
                                    type: 'info',
                                    date: new Date().toISOString(),
                                    role: 'all' // defaulting
                                } as any)
                                toast(payload.notification?.title || 'New Message', {
                                    description: payload.notification?.body || ''
                                })
                            })
                        } catch (err) {
                            console.error("FCM Token Error:", err)
                            toast.error("Failed to configure messaging")
                        }
                    }
                }
            } else {
                toast.error("Notifications not supported in this browser")
            }
        } catch (error) {
            console.error("Error requesting push permission:", error)
            toast.error("Something went wrong")
        }
    }

    // Expose requestPushPermission to context if needed, or call it from settings


    // Generate System Notifications
    useEffect(() => {
        if (!projects || !expenses) return

        const newNotifications: Notification[] = []
        const warnDays = notificationSettings?.warnDaysBeforeDue || 3

        // 1. Task Alerts (Due soon or Assigned)
        // Role-based visibility:
        // - Task notifications: only for creator or assigned user
        // - Deadline notifications: only for Manager, Admin, Owner
        const isManagerOrAbove = currentUser?.role === 'Manager' || currentUser?.role === 'Admin' || currentUser?.role === 'Owner'

        projects.forEach(project => {
            project.tasks?.forEach(task => { // Add safety check for tasks
                // Skip if done
                if (task.status === 'Done') return

                // Check if current user is related to this task (creator or assignee)
                const isAssignedToMe = task.assignedTo === currentUser?.name

                // Task assignment notifications - only for the assigned user
                if (notificationSettings.notifyOnTaskAssignment && isAssignedToMe && !readStatus[generateAlertId('assign', task.id)]) {
                    // Logic for assignment alert
                }

                // Deadline notifications - only for Manager+ AND also for the assigned user
                if (task.dueDate) {
                    const due = parseISO(task.dueDate)
                    const daysLeft = differenceInDays(due, new Date())

                    // Only show to managers+ OR the assigned user
                    const canSeeDeadline = isManagerOrAbove || isAssignedToMe

                    // Overdue
                    if (daysLeft < 0 && canSeeDeadline) {
                        newNotifications.push({
                            id: generateAlertId('overdue', task.id),
                            title: `${t.notifications.alerts.task_overdue}: ${task.title}`,
                            message: format(t.notifications.alerts.task_overdue_msg, { project: project.name, days: Math.abs(daysLeft) }),
                            type: 'error',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('overdue', task.id)],
                            link: `/projects/detail?id=${project.id}`,
                            relatedId: task.id
                        })
                    }
                    // Due Soon
                    else if (daysLeft <= warnDays && canSeeDeadline) {
                        newNotifications.push({
                            id: generateAlertId('due', task.id),
                            title: `${t.notifications.alerts.task_due_soon}: ${task.title}`,
                            message: daysLeft === 0
                                ? format(t.notifications.alerts.task_due_today_msg, { project: project.name })
                                : format(t.notifications.alerts.task_due_days_msg, { project: project.name, days: daysLeft }),
                            type: 'warning',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('due', task.id)],
                            link: `/projects/detail?id=${project.id}`,
                            relatedId: task.id
                        })
                    }
                }
            })
        })

        // 2. Expense Alerts (Unpaid/Credit)
        expenses.forEach(expense => {
            if (expense.status === 'Unpaid' || expense.status === 'Credit') {
                // Assuming expenses have a 'date' which acts as due date or invoice date?
                // If it's unpaid, let's warn if it's older than X days? Or if it has a specific due date?
                // The current Expense interface uses 'date' as transaction date. 
                // Let's assume due date is +30 days from transaction date for this logic, or just warn if it's distinct.

                // Simple logic: Warn if Unpaid expenses are older than 30 days (Overdue) 
                // OR just simply list them as "Pending Payment"

                const expenseDate = parseISO(expense.date)
                const age = differenceInDays(new Date(), expenseDate)

                if (age > 30) {
                    newNotifications.push({
                        id: generateAlertId('exp-overdue', expense.id),
                        title: `${t.notifications.alerts.payment_overdue}: ${expense.title}`,
                        message: format(t.notifications.alerts.expense_overdue_msg, { days: age }),
                        type: 'error',
                        date: new Date().toISOString(),
                        read: !!readStatus[generateAlertId('exp-overdue', expense.id)],
                        link: `/expenses`,
                        relatedId: expense.id
                    })
                } else if (age > 15) {
                    newNotifications.push({
                        id: generateAlertId('exp-warning', expense.id),
                        title: `${t.notifications.alerts.unpaid_expense}: ${expense.title}`,
                        message: format(t.notifications.alerts.expense_pending_msg, { days: age }),
                        type: 'warning',
                        date: new Date().toISOString(),
                        read: !!readStatus[generateAlertId('exp-warning', expense.id)],
                        link: `/expenses`,
                        relatedId: expense.id
                    })
                }
            }
        })

        // 3. Contract Installment Alerts
        contracts?.forEach(contract => {
            contract.installments.forEach(installment => {
                if (installment.status === 'Pending') {
                    const dueDate = parseISO(installment.dueDate)
                    const daysLeft = differenceInDays(dueDate, new Date())

                    if (daysLeft < 0) {
                        newNotifications.push({
                            id: generateAlertId('contract-overdue', installment.id),
                            title: t.notifications.alerts.installment_overdue,
                            message: format(t.notifications.alerts.installment_overdue_msg, { description: installment.description, contract: contract.title, days: Math.abs(daysLeft) }),
                            type: 'error',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('contract-overdue', installment.id)],
                            link: `/contracts`,
                            relatedId: contract.id
                        })
                    } else if (daysLeft <= warnDays) {
                        newNotifications.push({
                            id: generateAlertId('contract-due', installment.id),
                            title: t.notifications.alerts.installment_due_soon,
                            message: daysLeft === 0
                                ? format(t.notifications.alerts.installment_due_today_msg, { description: installment.description, contract: contract.title })
                                : format(t.notifications.alerts.installment_due_days_msg, { description: installment.description, contract: contract.title, days: daysLeft }),
                            type: 'warning',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('contract-due', installment.id)],
                            link: `/contracts`,
                            relatedId: contract.id
                        })
                    }
                }
            })
        })

        // MERGE: System + Realtime
        const allNotifications = [...realtimeNotifications, ...newNotifications]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Filter by Role/Target
        const filtered = allNotifications.filter(n => {
            // 1. Targeted specifically to me
            if (n.target === currentUser?.id) return true

            // 2. Broadcast to all
            if (n.target === 'all') return true

            // 3. Admin broadcast
            if (n.target === 'admin' && (currentUser?.role === 'Admin' || currentUser?.role === 'Owner')) return true

            // 4. Legacy (no target) - keep
            if (!n.target) return true

            return false
        })

        setNotifications(filtered)
    }, [projects, expenses, contracts, notificationSettings, readStatus, currentUser, t, currentTeam, realtimeNotifications])


    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setReadStatus(prev => ({ ...prev, [id]: true }))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        const newStatus: Record<string, boolean> = {}
        notifications.forEach(n => newStatus[n.id] = true)
        setReadStatus(prev => ({ ...prev, ...newStatus }))
    }

    const clearAll = () => {
        // Ideally just mark all as read or 'archived'
        // For now, clearing from view
        setNotifications([])
    }

    const addNotification = (notification: Omit<Notification, "id" | "read">) => {
        const newNotif: Notification = {
            ...notification,
            id: Date.now().toString(),
            read: false
        }
        setNotifications(prev => [newNotif, ...prev])
    }

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearAll,
            addNotification,
            requestPushPermission,
            permissionStatus,
            isPushEnabled
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}
