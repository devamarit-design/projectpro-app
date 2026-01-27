/**
 * Cloud Functions for ProjectPro App
 * Telegram Notification System
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import {
    sendTelegramMessage,
    formatExpenseNotification,
    formatTestMessage,
    formatPaymentDueReminder,
    formatQuotationNotification,
    formatDailyTaskSummary
} from './telegram'

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

// Region for deployment (Asia)
const region = 'asia-southeast1'

/**
 * Send expense notification to Telegram
 * Called from client after expense is created
 */
export const sendExpenseNotification = functions
    .region(region)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            )
        }

        const { orgId, expense } = data

        if (!orgId || !expense) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing orgId or expense data'
            )
        }

        try {
            // Get organization settings
            const orgDoc = await db.collection('organizations').doc(orgId).get()

            if (!orgDoc.exists) {
                throw new functions.https.HttpsError(
                    'not-found',
                    'Organization not found'
                )
            }

            const orgData = orgDoc.data()
            const telegramSettings = orgData?.settings?.telegram

            // Check if telegram is enabled
            if (!telegramSettings?.enabled || !telegramSettings?.notifyOnExpense) {
                return { success: true, skipped: true, reason: 'Telegram notifications disabled' }
            }

            const { botToken, chatId } = telegramSettings

            if (!botToken || !chatId) {
                return { success: false, error: 'Bot token or chat ID not configured' }
            }

            // Format and send message
            const message = formatExpenseNotification({
                projectName: expense.projectName || 'ไม่ระบุโครงการ',
                subProjectName: expense.subProjectName,
                itemName: expense.itemName || 'ไม่ระบุรายการ',
                amount: expense.amount || 0,
                userName: expense.userName || 'ไม่ระบุผู้ใช้',
                date: expense.date || new Date().toISOString().split('T')[0],
                status: expense.status || 'PENDING'
            })

            const result = await sendTelegramMessage(botToken, chatId, message)

            return result
        } catch (error) {
            console.error('Error sending expense notification:', error)
            throw new functions.https.HttpsError(
                'internal',
                'Failed to send notification'
            )
        }
    })

/**
 * Send quotation notification to Telegram
 * Called from client after quotation is created
 */
export const sendQuotationNotification = functions
    .region(region)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            )
        }

        const { orgId, quotation } = data

        if (!orgId || !quotation) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing orgId or quotation data'
            )
        }

        try {
            // Get organization settings
            const orgDoc = await db.collection('organizations').doc(orgId).get()

            if (!orgDoc.exists) {
                throw new functions.https.HttpsError(
                    'not-found',
                    'Organization not found'
                )
            }

            const orgData = orgDoc.data()
            const telegramSettings = orgData?.settings?.telegram

            // Check if telegram is enabled
            if (!telegramSettings?.enabled || !telegramSettings?.notifyOnQuotation) {
                return { success: true, skipped: true, reason: 'Telegram notifications disabled or quotation notification disabled' }
            }

            const { botToken, chatId } = telegramSettings

            if (!botToken || !chatId) {
                return { success: false, error: 'Bot token or chat ID not configured' }
            }

            // Format and send message
            const message = formatQuotationNotification({
                projectName: quotation.projectName || 'ไม่ระบุโครงการ',
                customerName: quotation.customerName || 'ทั่วไป',
                docNo: quotation.docNo || 'N/A',
                amount: quotation.amount || 0,
                userName: quotation.userName || 'ไม่ระบุผู้ใช้',
                date: quotation.date || new Date().toISOString().split('T')[0]
            })

            const result = await sendTelegramMessage(botToken, chatId, message)

            return result
        } catch (error) {
            console.error('Error sending quotation notification:', error)
            throw new functions.https.HttpsError(
                'internal',
                'Failed to send notification'
            )
        }
    })

/**
 * Test Telegram connection
 * Only accessible by organization owner
 */
export const testTelegramConnection = functions
    .region(region)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            )
        }

        const { orgId, botToken, chatId } = data

        if (!orgId || !botToken || !chatId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing required parameters'
            )
        }

        try {
            // Verify user is owner of the organization
            const orgDoc = await db.collection('organizations').doc(orgId).get()

            if (!orgDoc.exists) {
                throw new functions.https.HttpsError(
                    'not-found',
                    'Organization not found'
                )
            }

            const orgData = orgDoc.data()

            // Check if user is owner
            if (orgData?.ownerId !== context.auth.uid) {
                // Also check members array for Owner role
                const member = orgData?.members?.find(
                    (m: { userId: string; role: string }) => m.userId === context.auth?.uid
                )
                if (!member || member.role !== 'Owner') {
                    throw new functions.https.HttpsError(
                        'permission-denied',
                        'Only organization owner can test Telegram connection'
                    )
                }
            }

            // Send test message
            const orgName = orgData?.name || 'Unknown Organization'
            const message = formatTestMessage(orgName)
            const result = await sendTelegramMessage(botToken, chatId, message)

            return result
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                throw error
            }
            console.error('Error testing Telegram connection:', error)
            throw new functions.https.HttpsError(
                'internal',
                'Failed to test connection'
            )
        }
    })

/**
 * Test Daily Task Summary
 * Only accessible by organization owner
 */
export const testDailyTaskSummary = functions
    .region(region)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            )
        }

        const { orgId } = data

        if (!orgId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing orgId'
            )
        }

        try {
            // Verify user is owner of the organization
            const orgDoc = await db.collection('organizations').doc(orgId).get()

            if (!orgDoc.exists) {
                throw new functions.https.HttpsError(
                    'not-found',
                    'Organization not found'
                )
            }

            const orgData = orgDoc.data()
            const telegramSettings = orgData?.settings?.telegram

            // Check if telegram is enabled
            if (!telegramSettings?.enabled) {
                return { success: false, error: 'Telegram notifications are disabled' }
            }

            const { botToken, chatId } = telegramSettings
            if (!botToken || !chatId) {
                return { success: false, error: 'Bot token or chat ID not configured' }
            }

            // Check if user is owner
            if (orgData?.ownerId !== context.auth.uid) {
                // Also check members array for Owner role
                const member = orgData?.members?.find(
                    (m: { userId: string; role: string }) => m.userId === context.auth?.uid
                )
                if (!member || member.role !== 'Owner') {
                    throw new functions.https.HttpsError(
                        'permission-denied',
                        'Only organization owner can test daily summary'
                    )
                }
            }

            const today = new Date()
            const dateDisplay = today.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })


            // Query all tasks for organization (filter status memory to avoid index issues)
            const tasksSnapshot = await db
                .collection('tasks')
                .where('organizationId', '==', orgId)
                .get()

            if (tasksSnapshot.empty) {
                const message = formatDailyTaskSummary({
                    date: dateDisplay,
                    tasks: []
                })
                await sendTelegramMessage(botToken, chatId, message)
                return { success: true, message: 'Sent empty summary (no tasks)' }
            }

            // Filter tasks due today
            const dueTasks: any[] = []

            for (const taskDoc of tasksSnapshot.docs) {
                const task = taskDoc.data()

                // Active tasks only
                if (task.status === 'done') continue
                if (!task.dueDate) continue

                try {
                    const taskDate = new Date(task.dueDate)
                    // Check if it's today in Thai time
                    const taskDateStr = taskDate.toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok', day: 'numeric', month: 'numeric', year: 'numeric'
                    })
                    const todayDateStr = today.toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok', day: 'numeric', month: 'numeric', year: 'numeric'
                    })

                    if (taskDateStr === todayDateStr) {
                        dueTasks.push(task)
                    }
                } catch (e) {
                    // Invalid date
                }
            }

            if (dueTasks.length === 0) {
                const message = formatDailyTaskSummary({
                    date: dateDisplay,
                    tasks: []
                })
                await sendTelegramMessage(botToken, chatId, message)
                return { success: true, message: 'Sent empty summary (no due tasks)' }
            }

            // Group tasks by project
            const tasksByProject: Record<string, { title: string; assignee: string }[]> = {}
            const projectNames: Record<string, string> = {}
            const userNames: Record<string, string> = {}

            for (const task of dueTasks) {
                const projectId = task.projectId || 'unknown'

                if (!projectNames[projectId]) {
                    if (projectId === 'unknown') {
                        projectNames[projectId] = 'ไม่ระบุโครงการ'
                    } else {
                        const pDoc = await db.collection('projects').doc(projectId).get()
                        projectNames[projectId] = pDoc.data()?.name || 'ไม่ระบุโครงการ'
                    }
                }

                let assigneeName = ''
                if (task.assigneeId) {
                    if (userNames[task.assigneeId]) {
                        assigneeName = userNames[task.assigneeId]
                    } else {
                        const uDoc = await db.collection('users').doc(task.assigneeId).get()
                        const userData = uDoc.data()
                        assigneeName = userData?.displayName || userData?.name || 'Unknown'
                        userNames[task.assigneeId] = assigneeName
                    }
                }

                if (!tasksByProject[projectId]) {
                    tasksByProject[projectId] = []
                }

                tasksByProject[projectId].push({
                    title: task.title || 'Untitled Task',
                    assignee: assigneeName
                })
            }

            const groupedTasks = Object.keys(tasksByProject).map(projectId => ({
                projectName: projectNames[projectId],
                tasks: tasksByProject[projectId]
            }))

            const message = formatDailyTaskSummary({
                date: dateDisplay,
                tasks: groupedTasks
            })

            const result = await sendTelegramMessage(botToken, chatId, message)
            return result

        } catch (error) {
            console.error('Error testing daily summary:', error)
            throw new functions.https.HttpsError(
                'internal',
                `Failed to test daily summary: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    })

/**
 * Scheduled function to send payment due reminders
 * Runs daily at 9:00 AM Bangkok time
 */
export const sendPaymentDueReminders = functions
    .region(region)
    .pubsub.schedule('0 9 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        console.log('Running payment due reminders...')

        try {
            // Get all organizations with telegram enabled
            const orgsSnapshot = await db.collection('organizations').get()

            for (const orgDoc of orgsSnapshot.docs) {
                const orgData = orgDoc.data()
                const telegramSettings = orgData?.settings?.telegram

                // Skip if telegram not enabled or payment due notifications disabled
                if (!telegramSettings?.enabled || !telegramSettings?.notifyOnPaymentDue) {
                    continue
                }

                const { botToken, chatId, paymentDueDays = 3 } = telegramSettings

                if (!botToken || !chatId) {
                    continue
                }

                // Get expenses that are due within the specified days
                const today = new Date()
                const dueDate = new Date()
                dueDate.setDate(today.getDate() + paymentDueDays)

                const expensesSnapshot = await db
                    .collection('expenses')
                    .where('organizationId', '==', orgDoc.id)
                    .where('status', '==', 'PENDING')
                    .get()

                for (const expenseDoc of expensesSnapshot.docs) {
                    const expense = expenseDoc.data()

                    // Check if expense has a due date
                    if (!expense.dueDate) continue

                    const expenseDueDate = new Date(expense.dueDate)
                    const daysUntilDue = Math.ceil(
                        (expenseDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    )

                    // Send reminder if due within specified days
                    if (daysUntilDue >= 0 && daysUntilDue <= paymentDueDays) {
                        // Get project name
                        let projectName = 'ไม่ระบุโครงการ'
                        if (expense.projectId) {
                            const projectDoc = await db
                                .collection('projects')
                                .doc(expense.projectId)
                                .get()
                            if (projectDoc.exists) {
                                projectName = projectDoc.data()?.name || projectName
                            }
                        }

                        const message = formatPaymentDueReminder({
                            projectName,
                            itemName: expense.name || 'ไม่ระบุรายการ',
                            amount: expense.totalValue || 0,
                            dueDate: expense.dueDate,
                            daysUntilDue
                        })

                        await sendTelegramMessage(botToken, chatId, message)
                    }
                }
            }

            console.log('Payment due reminders completed')
            return null
        } catch (error) {
            console.error('Error sending payment due reminders:', error)
            return null
        }
    })

/**
 * Scheduled function to send daily task summary
 * Runs daily at 8:00 AM Bangkok time
 */
export const sendDailyTaskSummary = functions
    .region(region)
    .pubsub.schedule('0 8 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        console.log('Running daily task summary...')

        try {
            // Get all organizations with telegram enabled
            const orgsSnapshot = await db.collection('organizations').get()
            const today = new Date()

            // Format date for display (e.g., 23 Jan 2026)
            const dateDisplay = today.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })


            for (const orgDoc of orgsSnapshot.docs) {
                const orgData = orgDoc.data()
                const telegramSettings = orgData?.settings?.telegram

                // Skip if disabled
                if (!telegramSettings?.enabled || !telegramSettings?.notifyOnDailyTasks) {
                    continue
                }

                const { botToken, chatId } = telegramSettings

                if (!botToken || !chatId) {
                    continue
                }

                // Query all active tasks (avoid index issues)
                const tasksSnapshot = await db
                    .collection('tasks')
                    .where('organizationId', '==', orgDoc.id)
                    .get()

                if (tasksSnapshot.empty) {
                    const message = formatDailyTaskSummary({
                        date: dateDisplay,
                        tasks: []
                    })
                    await sendTelegramMessage(botToken, chatId, message)
                    continue
                }

                // Filter tasks due today
                const dueTasks: any[] = []

                for (const taskDoc of tasksSnapshot.docs) {
                    const task = taskDoc.data()

                    // Active Only
                    if (task.status === 'done') continue
                    if (!task.dueDate) continue

                    try {
                        const taskDate = new Date(task.dueDate)
                        // Check if it's today in Thai time
                        // Convert both to Thai date string for comparison
                        const taskDateStr = taskDate.toLocaleDateString('th-TH', {
                            timeZone: 'Asia/Bangkok', day: 'numeric', month: 'numeric', year: 'numeric'
                        })
                        const todayDateStr = today.toLocaleDateString('th-TH', {
                            timeZone: 'Asia/Bangkok', day: 'numeric', month: 'numeric', year: 'numeric'
                        })

                        if (taskDateStr === todayDateStr) {
                            dueTasks.push(task)
                        }
                    } catch (e) {
                        // Invalid date
                    }
                }

                if (dueTasks.length === 0) {
                    const message = formatDailyTaskSummary({
                        date: dateDisplay,
                        tasks: []
                    })
                    await sendTelegramMessage(botToken, chatId, message)
                    continue
                }

                // Group tasks by project
                const tasksByProject: Record<string, { title: string; assignee: string }[]> = {}
                const projectNames: Record<string, string> = {}
                const userNames: Record<string, string> = {} // Cache user names

                for (const task of dueTasks) {
                    const projectId = task.projectId || 'unknown'

                    // Fetch Project Name if not cached
                    if (!projectNames[projectId]) {
                        if (projectId === 'unknown') {
                            projectNames[projectId] = 'ไม่ระบุโครงการ'
                        } else {
                            const pDoc = await db.collection('projects').doc(projectId).get()
                            projectNames[projectId] = pDoc.data()?.name || 'ไม่ระบุโครงการ'
                        }
                    }

                    // Fetch Assignee Name if not cached
                    let assigneeName = ''
                    if (task.assigneeId) {
                        if (userNames[task.assigneeId]) {
                            assigneeName = userNames[task.assigneeId]
                        } else {
                            const uDoc = await db.collection('users').doc(task.assigneeId).get()
                            // Try to get from user profile or member list name? 
                            // Using displayName from user doc
                            const userData = uDoc.data()
                            assigneeName = userData?.displayName || userData?.name || 'Unknown'
                            userNames[task.assigneeId] = assigneeName
                        }
                    }

                    if (!tasksByProject[projectId]) {
                        tasksByProject[projectId] = []
                    }

                    tasksByProject[projectId].push({
                        title: task.title || 'Untitled Task',
                        assignee: assigneeName
                    })
                }

                // Transform to array for formatter
                const groupedTasks = Object.keys(tasksByProject).map(projectId => ({
                    projectName: projectNames[projectId],
                    tasks: tasksByProject[projectId]
                }))

                const message = formatDailyTaskSummary({
                    date: dateDisplay,
                    tasks: groupedTasks
                })

                await sendTelegramMessage(botToken, chatId, message)
            }

            return null
        } catch (error) {
            console.error('Error sending daily task summary:', error)
            return null
        }
    })

/**
 * Remove user from organization
 * Callable by Owner/Admin
 */
export const removeUserFromOrg = functions
    .region(region)
    .https.onCall(async (data, context) => {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            )
        }

        const { userId, orgId } = data

        if (!userId || !orgId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing userId or orgId'
            )
        }

        console.log(`Removing user ${userId} from org ${orgId}. Caller: ${context.auth.uid}`)

        try {
            // 1. Verify Caller is Admin/Owner of this Org
            const callerId = context.auth.uid
            const callerDoc = await db.collection('users').doc(callerId).get()

            if (!callerDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Caller profile not found')
            }

            const callerData = callerDoc.data()

            // Check if caller belongs to org (checking both legacy and new structure)
            const isMember = callerData?.orgIds?.includes(orgId) ||
                callerData?.organizations?.some((o: any) => o.orgId === orgId);

            const role = callerData?.role

            if (!isMember || (role !== 'Owner' && role !== 'Admin')) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Only Owner or Admin can remove users'
                )
            }

            // 2. Remove orgId from target user's records
            const userRef = db.collection('users').doc(userId)
            const userDoc = await userRef.get()

            if (!userDoc.exists) {
                // If document is missing, arrayRemove might fail silently or error in some SDKs
                // But here we'll just handle it
                throw new functions.https.HttpsError('not-found', 'Target user not found')
            }

            const userData = userDoc.data()
            const updates: any = {}

            // Remove from legacy orgIds
            if (userData?.orgIds) {
                updates.orgIds = admin.firestore.FieldValue.arrayRemove(orgId)
            }

            // Remove from new organizations array
            if (userData?.organizations) {
                const newOrgs = userData.organizations.filter((o: any) => o.orgId !== orgId)
                if (newOrgs.length !== userData.organizations.length) {
                    updates.organizations = newOrgs
                }
            }

            if (Object.keys(updates).length > 0) {
                await userRef.update(updates)
            }

            return { success: true }

        } catch (error) {
            console.error('Error removing user from org:', error)
            if (error instanceof functions.https.HttpsError) throw error
            throw new functions.https.HttpsError(
                'internal',
                'Failed to remove user'
            )
        }
    })
