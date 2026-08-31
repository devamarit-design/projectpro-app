"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs, limit, startAfter } from "firebase/firestore"
import { useOrganization } from "@/context/organization-context"
import { logActivity } from "@/lib/activity-logger"
import { ProjectTask, TaskStatus, Priority, WorkItem, User } from "./project-context"
import { authenticatedFetch } from "@/lib/authenticated-fetch"

interface TaskContextType {
    tasks: ProjectTask[]
    archivedTasks: ProjectTask[]
    works: WorkItem[]
    addTask: (projectId: string, task: Omit<ProjectTask, "id" | "projectId" | "orgId">) => Promise<string | undefined>
    updateTask: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>
    deleteTask: (taskId: string) => Promise<void>
    toggleTask: (taskId: string) => Promise<void>
    archiveTask: (taskId: string) => Promise<void>
    unarchiveTask: (taskId: string) => Promise<void>
    setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>
    loadMoreTasks: () => Promise<void>
    loadArchivedTasks: () => Promise<void>
    hasMoreTasks: boolean
    isLoading: boolean

    // Work Management
    addWork: (projectId: string, work: Omit<WorkItem, "id" | "projectId" | "orgId">) => Promise<string | undefined>
    updateWork: (projectId: string, workId: string, updates: Partial<WorkItem>) => Promise<void>
    deleteWork: (projectId: string, workId: string) => Promise<void>
    updateWorkOrder: (updates: { id: string, sortOrder: number }[]) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children, currentUser }: { children: React.ReactNode, currentUser: User | null }) {
    useEffect(() => {
        console.log("[TaskContext] 🟢 DOMAIN MOUNTED - Version 1.1.0 (Optimized)")
    }, [])

    // 0. State
    const { currentOrg: currentTeam } = useOrganization()
    const [tasks, setTasks] = useState<ProjectTask[]>([])
    const [archivedTasks, setArchivedTasks] = useState<ProjectTask[]>([])
    const [works, setWorks] = useState<WorkItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [hasMoreTasks, setHasMoreTasks] = useState(true)
    const [lastTaskDoc, setLastTaskDoc] = useState<any>(null)

    const INITIAL_LIMIT = 50

    // 1. Active Tasks Listener (with Limit and OrderBy)
    useEffect(() => {
        if (!currentTeam?.id) return
        setIsLoading(true)

        console.log(`[TaskContext] 🟢 Initializing ACTIVE Listener (Limit ${INITIAL_LIMIT}) for Org: ${currentTeam.id}`)

        const q = query(
            collection(db, "tasks"),
            where("orgId", "==", currentTeam.id),
            where("isArchived", "==", false),
            orderBy("createdAt", "desc"),
            limit(INITIAL_LIMIT)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`[TaskContext] 📦 ACTIVE Snapshot. Docs: ${snapshot.docs.length}. FromCache: ${snapshot.metadata.fromCache}`)

            const activeTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProjectTask))
            setTasks(activeTasks)

            if (snapshot.docs.length > 0) {
                setLastTaskDoc(snapshot.docs[snapshot.docs.length - 1])
            }
            setHasMoreTasks(snapshot.docs.length === INITIAL_LIMIT)
            setIsLoading(false)
        }, (error) => {
            console.error(`[TaskContext] 🔴 ACTIVE Snapshot Error:`, error)
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [currentTeam?.id])

    const loadMoreTasks = useCallback(async () => {
        if (!currentTeam?.id || !lastTaskDoc || !hasMoreTasks) return

        const q = query(
            collection(db, "tasks"),
            where("orgId", "==", currentTeam.id),
            where("isArchived", "==", false),
            orderBy("createdAt", "desc"),
            startAfter(lastTaskDoc),
            limit(INITIAL_LIMIT)
        )

        try {
            const snapshot = await getDocs(q)
            const moreTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProjectTask))

            if (moreTasks.length > 0) {
                setTasks(prev => {
                    // Prevent duplicates
                    const existingIds = new Set(prev.map(t => t.id))
                    const uniqueNewTasks = moreTasks.filter(t => !existingIds.has(t.id))
                    return [...prev, ...uniqueNewTasks]
                })
                setLastTaskDoc(snapshot.docs[snapshot.docs.length - 1])
            }
            setHasMoreTasks(snapshot.docs.length === INITIAL_LIMIT)
        } catch (error) {
            console.error("[TaskContext] Error loading more tasks:", error)
        }
    }, [currentTeam?.id, lastTaskDoc, hasMoreTasks])

    const [isArchivedLoading, setIsArchivedLoading] = useState(false)

    // 2. Archived Tasks (Lazy Load)
    const loadArchivedTasks = useCallback(async () => {
        if (!currentTeam?.id || archivedTasks.length > 0) return
        setIsArchivedLoading(true)

        const q = query(
            collection(db, "tasks"),
            where("orgId", "==", currentTeam.id),
            where("isArchived", "==", true),
            orderBy("createdAt", "desc"),
            limit(100)
        )

        try {
            const snapshot = await getDocs(q)
            const archived = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProjectTask))
            setArchivedTasks(archived)
        } catch (error) {
            console.error("[TaskContext] Error loading archived tasks:", error)
        } finally {
            setIsArchivedLoading(false)
        }
    }, [currentTeam?.id, archivedTasks.length])

    // 3. Work Listener (Gantt)
    useEffect(() => {
        if (!currentTeam?.id) return
        const q = query(collection(db, "works"), where("orgId", "==", currentTeam.id))
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as WorkItem))
            setWorks(data)
        })
        return () => unsubscribe()
    }, [currentTeam?.id])

    // ACTIONS WITH OPTIMISTIC UI
    const addTask = useCallback(async (projectId: string, taskData: Omit<ProjectTask, "id" | "projectId" | "orgId">) => {
        if (!currentTeam) {
            console.error("[TaskContext] ❌ Cannot add task: No active organization selected");
            throw new Error("No active organization selected");
        }

        const tempId = `temp-${Date.now()}`
        const newTask: ProjectTask = {
            ...taskData,
            id: tempId,
            projectId,
            orgId: currentTeam.id,
            status: taskData.status || "Todo",
            priority: taskData.priority || "Medium",
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id || "unknown",
            isArchived: false
        }

        // OPTIMISTIC UPDATE
        setTasks(prev => [newTask, ...prev])

        try {
            const payload = { ...newTask }
            delete (payload as any).id // Let Firestore generate ID
            // Remove undefined fields (Firestore doesn't accept undefined)
            Object.keys(payload).forEach(key => {
                if ((payload as any)[key] === undefined) delete (payload as any)[key]
            })

            console.log(`[TaskContext] 🚀 Attempting to add task to Firestore:`, payload)
            const docRef = await addDoc(collection(db, "tasks"), payload)
            console.log(`[TaskContext] ✅ Task written to Firestore with ID: ${docRef.id}`)

            // Asynchronous logging
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "TASK",
                entityId: docRef.id,
                entityTitle: newTask.title,
                details: `Created new task: ${newTask.title}`,
                performedBy: {
                    uid: currentUser?.id || "unknown",
                    name: currentUser?.name || "Unknown",
                    role: currentUser?.role || "Staff"
                },
                relatedUserIds: newTask.assignedTo || []
            })

            // Push Notification for Assignees
            if (newTask.assignedTo && newTask.assignedTo.length > 0) {
                const targetUserIds = newTask.assignedTo.filter(id => id !== currentUser?.id)
                if (targetUserIds.length > 0) {
                    authenticatedFetch('/api/notifications/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userIds: targetUserIds,
                            orgId: currentTeam.id,
                            title: `New Task Assigned: ${newTask.title}`,
                            body: `${currentUser?.name} assigned you to a new task.`,
                            url: `/projects/detail?id=${projectId}&taskId=${docRef.id}`
                        })
                    }).catch(console.error)
                }
            }

            return docRef.id
        } catch (e) {
            console.error("[TaskContext] ❌ Error adding task to Firestore:", e)
            setTasks(prev => prev.filter(t => t.id !== tempId)) // Rollback
            throw e; // Re-throw to let caller handle it
        }
    }, [currentTeam, currentUser])

    const updateTask = useCallback(async (taskId: string, updates: Partial<ProjectTask>) => {
        const originalTasks = [...tasks]

        // OPTIMISTIC UPDATE
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
        if (updates.isArchived) {
            setTasks(prev => prev.filter(t => t.id !== taskId))
            // If it was archived, it will be added by the archived listener
        }

        try {
            await updateDoc(doc(db, "tasks", taskId), {
                ...updates,
                updatedAt: new Date().toISOString()
            })

            if (currentTeam && currentUser) {
                logActivity(db, currentTeam.id, {
                    action: "UPDATE",
                    entityType: "TASK",
                    entityId: taskId,
                    entityTitle: updates.title || "Task",
                    details: `Updated task: ${updates.title || taskId}`,
                    performedBy: {
                        uid: currentUser.id,
                        name: currentUser.name,
                        role: currentUser.role
                    },
                    relatedUserIds: updates.assignedTo || []
                })

                // Push Notification for NEW Assignees
                if (updates.assignedTo) {
                    const currentTask = tasks.find(t => t.id === taskId)
                    const newAssignees = updates.assignedTo.filter(id =>
                        !currentTask?.assignedTo?.includes(id) && id !== currentUser.id
                    )

                    if (newAssignees.length > 0) {
                        authenticatedFetch('/api/notifications/push/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userIds: newAssignees,
                                orgId: currentTeam.id,
                                title: `Task Assigned: ${updates.title || currentTask?.title || 'Unknown Task'}`,
                                body: `${currentUser.name} assigned you to this task.`,
                                url: `/projects/detail?id=${currentTask?.projectId}&taskId=${taskId}`
                            })
                        }).catch(console.error)
                    }
                }
            }
        } catch (e) {
            console.error("Error updating task", e)
            setTasks(originalTasks) // Rollback
        }
    }, [tasks, currentTeam, currentUser])

    const deleteTask = useCallback(async (taskId: string) => {
        const originalTasks = [...tasks]

        // OPTIMISTIC UPDATE
        setTasks(prev => prev.filter(t => t.id !== taskId))

        try {
            await deleteDoc(doc(db, "tasks", taskId))
            if (currentTeam && currentUser) {
                logActivity(db, currentTeam.id, {
                    action: "DELETE",
                    entityType: "TASK",
                    entityId: taskId,
                    entityTitle: "Deleted Task",
                    details: `Deleted task: ${taskId}`,
                    performedBy: {
                        uid: currentUser.id,
                        name: currentUser.name,
                        role: currentUser.role
                    },
                    relatedUserIds: []
                })
            }
        } catch (e) {
            console.error("Error deleting task", e)
            setTasks(originalTasks) // Rollback
        }
    }, [tasks, currentTeam, currentUser])

    const toggleTask = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const newStatus = task.status === 'Done' ? 'Todo' : 'Done'
        const updates: any = {
            status: newStatus,
            updatedAt: new Date().toISOString()
        }

        if (newStatus === 'Done') {
            updates.doneAt = new Date().toISOString()
        } else {
            updates.doneAt = null
        }

        // OPTIMISTIC UPDATE
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))

        try {
            await updateDoc(doc(db, "tasks", taskId), updates)
            if (currentTeam && currentUser) {
                logActivity(db, currentTeam.id, {
                    action: "UPDATE",
                    entityType: "TASK",
                    entityId: taskId,
                    entityTitle: task.title,
                    details: `Changed status to ${newStatus}`,
                    performedBy: {
                        uid: currentUser.id,
                        name: currentUser.name,
                        role: currentUser.role
                    },
                    relatedUserIds: task.assignedTo || []
                })
            }
        } catch (e) {
            console.error("Error toggling task", e)
            // Re-sync will happen via snapshot
        }
    }, [tasks, currentTeam, currentUser])

    const archiveTask = useCallback(async (taskId: string) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { isArchived: true })
        } catch (e) {
            console.error("Error archiving task", e)
        }
    }, [])

    const unarchiveTask = useCallback(async (taskId: string) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { isArchived: false })
        } catch (e) {
            console.error("Error unarchiving task", e)
        }
    }, [])

    // 4. Auto-archive Logic
    const [hasCheckedAutoArchive, setHasCheckedAutoArchive] = useState<string | null>(null)
    useEffect(() => {
        if (!currentTeam?.id || tasks.length === 0 || hasCheckedAutoArchive === currentTeam.id) return

        const performAutoArchive = async () => {
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)

            const tasksToArchive = tasks.filter(task =>
                task.status === 'Done' &&
                task.doneAt &&
                !task.isArchived &&
                new Date(task.doneAt) < oneDayAgo
            )

            if (tasksToArchive.length > 0) {
                setHasCheckedAutoArchive(currentTeam.id)
                for (const task of tasksToArchive) {
                    try {
                        await updateDoc(doc(db, "tasks", task.id), { isArchived: true })
                    } catch (e) {
                        console.error("[AutoArchive] Failed to archive task:", task.id, e)
                    }
                }
            } else {
                setHasCheckedAutoArchive(currentTeam.id)
            }
        }

        performAutoArchive()
    }, [currentTeam?.id, tasks.length, hasCheckedAutoArchive])

    // 4. Work Actions
    const addWork = useCallback(async (projectId: string, workData: Omit<WorkItem, "id" | "projectId" | "orgId">) => {
        if (!currentTeam) return
        try {
            const newWork = {
                ...workData,
                projectId,
                orgId: currentTeam.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            const docRef = await addDoc(collection(db, "works"), newWork)

            // Log Activity
            logActivity(db, currentTeam.id, {
                action: "CREATE",
                entityType: "WORK",
                entityId: docRef.id,
                entityTitle: workData.title,
                details: `Created new work item: ${workData.title}`,
                performedBy: {
                    uid: currentUser?.id || "unknown",
                    name: currentUser?.name || "Unknown",
                    role: currentUser?.role || "Staff"
                },
                relatedUserIds: []
            })

            return docRef.id
        } catch (e) {
            console.error("Error adding work", e)
            throw e
        }
    }, [currentTeam, currentUser])

    const updateWork = useCallback(async (projectId: string, workId: string, updates: Partial<WorkItem>) => {
        try {
            await updateDoc(doc(db, "works", workId), {
                ...updates,
                updatedAt: new Date().toISOString()
            })

            if (currentTeam && currentUser) {
                logActivity(db, currentTeam.id, {
                    action: "UPDATE",
                    entityType: "WORK",
                    entityId: workId,
                    entityTitle: updates.title || "Work",
                    details: `Updated work item`,
                    performedBy: {
                        uid: currentUser.id,
                        name: currentUser.name,
                        role: currentUser.role
                    },
                    relatedUserIds: []
                })
            }
        } catch (e) {
            console.error("Error updating work", e)
            throw e
        }
    }, [currentTeam, currentUser])

    const deleteWork = useCallback(async (projectId: string, workId: string) => {
        try {
            await deleteDoc(doc(db, "works", workId))

            if (currentTeam && currentUser) {
                logActivity(db, currentTeam.id, {
                    action: "DELETE",
                    entityType: "WORK",
                    entityId: workId,
                    entityTitle: "Deleted Work",
                    details: `Deleted work item`,
                    performedBy: {
                        uid: currentUser.id,
                        name: currentUser.name,
                        role: currentUser.role
                    },
                    relatedUserIds: []
                })
            }
        } catch (e) {
            console.error("Error deleting work", e)
            throw e
        }
    }, [currentTeam, currentUser])

    const updateWorkOrder = useCallback(async (updates: { id: string, sortOrder: number }[]) => {
        try {
            const batchPromises = updates.map(u =>
                updateDoc(doc(db, "works", u.id), { sortOrder: u.sortOrder })
            )
            await Promise.all(batchPromises)
        } catch (e) {
            console.error("Error updating work order", e)
            throw e
        }
    }, [])

    const value = useMemo(() => ({
        tasks,
        archivedTasks,
        works,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        archiveTask,
        unarchiveTask,
        setTasks,
        loadMoreTasks,
        loadArchivedTasks,
        hasMoreTasks,
        isLoading,
        // Work Actions
        addWork,
        updateWork,
        deleteWork,
        updateWorkOrder
    }), [tasks, archivedTasks, works, addTask, updateTask, deleteTask, toggleTask, archiveTask, unarchiveTask, loadMoreTasks, loadArchivedTasks, hasMoreTasks, isLoading, addWork, updateWork, deleteWork, updateWorkOrder])

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    )
}

export function useTasks() {
    const context = useContext(TaskContext)
    if (context === undefined) {
        throw new Error("useTasks must be used within a TaskProvider")
    }
    return context
}
