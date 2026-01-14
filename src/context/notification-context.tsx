"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useProjects, ProjectTask, Expense } from "./project-context"
import { useSettings } from "./settings-context"
import { differenceInDays, parseISO, isPast, addDays } from "date-fns"

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
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
    addNotification: (notification: Omit<Notification, "id" | "read">) => void
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
        link: "/projects/1",
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
        link: "/projects/1",
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { projects, expenses, contracts, currentUser } = useProjects()
    const { notificationSettings } = useSettings()

    // Load read status from local storage
    const [readStatus, setReadStatus] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const storedReadStatus = localStorage.getItem("pp_notifications_read")
        if (storedReadStatus) {
            setReadStatus(JSON.parse(storedReadStatus))
        }
    }, [])

    useEffect(() => {
        if (Object.keys(readStatus).length > 0) {
            localStorage.setItem("pp_notifications_read", JSON.stringify(readStatus))
        }
    }, [readStatus])

    // Generate System Notifications
    useEffect(() => {
        if (!projects || !expenses) return

        const newNotifications: Notification[] = []
        const warnDays = notificationSettings?.warnDaysBeforeDue || 3

        // 1. Task Alerts (Due soon or Assigned)
        projects.forEach(project => {
            project.tasks?.forEach(task => {
                // Skip if done
                if (task.status === 'Done') return

                // Check Assignment
                if (notificationSettings.notifyOnTaskAssignment && task.assignedTo === currentUser?.name && !readStatus[generateAlertId('assign', task.id)]) {
                    // Logic for assignment alert (simplified, usually assumes 'new' but here just checking existence)
                    // For a purely client-side app, strictly "new" is hard without history. 
                    // We'll skip "New Assignment" spam on reload and focus on Due Dates.
                }

                if (task.dueDate) {
                    const due = parseISO(task.dueDate)
                    const daysLeft = differenceInDays(due, new Date())

                    // Overdue
                    if (daysLeft < 0) {
                        newNotifications.push({
                            id: generateAlertId('overdue', task.id),
                            title: `Task Overdue: ${task.title}`,
                            message: `Task in ${project.name} is overdue by ${Math.abs(daysLeft)} days.`,
                            type: 'error',
                            date: new Date().toISOString(), // In real app, this should be the date it BECAME overdue
                            read: !!readStatus[generateAlertId('overdue', task.id)],
                            link: `/projects/${project.id}`,
                            relatedId: task.id
                        })
                    }
                    // Due Soon
                    else if (daysLeft <= warnDays) {
                        newNotifications.push({
                            id: generateAlertId('due', task.id),
                            title: `Task Due Soon: ${task.title}`,
                            message: `Task in ${project.name} is due in ${daysLeft === 0 ? 'today' : daysLeft + ' days'}.`,
                            type: 'warning',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('due', task.id)],
                            link: `/projects/${project.id}`,
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
                        title: `Payment Overdue: ${expense.title}`,
                        message: `Expense is unpaid for ${age} days.`,
                        type: 'error',
                        date: new Date().toISOString(),
                        read: !!readStatus[generateAlertId('exp-overdue', expense.id)],
                        link: `/expenses`,
                        relatedId: expense.id
                    })
                } else if (age > 15) {
                    newNotifications.push({
                        id: generateAlertId('exp-warning', expense.id),
                        title: `Unpaid Expense: ${expense.title}`,
                        message: `Expense is pending payment for ${age} days.`,
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
                            title: `Installment Overdue`,
                            message: `Payment '${installment.description}' for ${contract.title} is overdue by ${Math.abs(daysLeft)} days.`,
                            type: 'error',
                            date: new Date().toISOString(),
                            read: !!readStatus[generateAlertId('contract-overdue', installment.id)],
                            link: `/contracts`,
                            relatedId: contract.id
                        })
                    } else if (daysLeft <= warnDays) {
                        newNotifications.push({
                            id: generateAlertId('contract-due', installment.id),
                            title: `Installment Due Soon`,
                            message: `Payment '${installment.description}' for ${contract.title} is due in ${daysLeft === 0 ? 'today' : daysLeft + ' days'}.`,
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

        setNotifications(newNotifications)

    }, [projects, expenses, contracts, notificationSettings, readStatus, currentUser])


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
            addNotification
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
