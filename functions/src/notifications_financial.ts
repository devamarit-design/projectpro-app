import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Helper: Get Admin Tokens for an Organization
async function getOrgAdminTokens(orgId: string): Promise<string[]> {
    const db = admin.firestore()

    // 1. Get Org Members who are Admins/Owners
    const orgRef = db.collection('organizations').doc(orgId)
    const orgSnap = await orgRef.get()

    if (!orgSnap.exists) return []

    const orgData = orgSnap.data()
    const members = orgData?.members || []

    // Filter for Admin or Owner
    const adminUserIds = members
        .filter((m: any) => m.role === 'Admin' || m.role === 'Owner')
        .map((m: any) => m.userId)

    if (adminUserIds.length === 0) return []

    // 2. Get Tokens for these users
    const tokens: string[] = []

    // Firestore 'in' query supports max 10 items. If we have more, we might need to loop or simple map.
    // For safety, let's just map get() since admin count is usually low.
    const userPromises = adminUserIds.map((uid: string) => db.collection('users').doc(uid).get())
    const userSnaps = await Promise.all(userPromises)

    userSnaps.forEach(snap => {
        if (snap.exists) {
            const userData = snap.data()
            if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
                tokens.push(...userData.fcmTokens)
            }
        }
    })

    return [...new Set(tokens)] // Deduplicate
}

// Helper: Get User Tokens
async function getUserTokens(userId: string): Promise<string[]> {
    const db = admin.firestore()
    const snap = await db.collection('users').doc(userId).get()
    if (!snap.exists) return []

    const data = snap.data()
    return (data?.fcmTokens && Array.isArray(data.fcmTokens)) ? data.fcmTokens : []
}

/**
 * Trigger: New Expense Created
 * Logic: 
 * - If Status is Pending/Unpaid/Advanced/Credit (Request) -> Notify Admins
 * - If Status is Paid -> Notify Admins (as Info/Audit)
 */
export const onExpenseCreated = functions
    .region('asia-southeast1')
    .firestore.document('expenses/{expenseId}')
    .onCreate(async (snap, context) => {
        const messaging = admin.messaging()
        const expense = snap.data()
        const orgId = expense.orgId

        if (!orgId) return null

        const amount = expense.amount || '0'
        const title = expense.title || 'Expense'
        const category = expense.category || 'Other'

        // Determine Message based on status
        let notificationTitle = ''
        let notificationBody = ''

        if (expense.status === 'Paid') {
            notificationTitle = 'New Payment Recorded 💸'
            notificationBody = `${title} (${amount}) - Paid`
        } else {
            // Withdrawal Request / Pending
            notificationTitle = 'New Expense Request 🧾'
            notificationBody = `${title} (${amount}) - Request for ${category}`
        }

        try {
            const tokens = await getOrgAdminTokens(orgId)

            if (tokens.length === 0) {
                console.log(`No admins to notify for org ${orgId}`)
                return null
            }

            const payload: admin.messaging.MulticastMessage = {
                tokens: tokens,
                notification: {
                    title: notificationTitle,
                    body: notificationBody,
                },
                data: {
                    type: 'EXPENSE',
                    expenseId: context.params.expenseId,
                    orgId: orgId,
                    url: '/finance'
                },
                android: { notification: { icon: 'stock_ticker_update', color: '#f44336' } },
                apns: { payload: { aps: { badge: 1, sound: 'default' } } }
            }

            const response = await messaging.sendEachForMulticast(payload)
            console.log(`Sent expense notification to ${response.successCount} admins`)
            return { success: true }

        } catch (error) {
            console.error("Error sending expense notification", error)
            return null
        }
    })

/**
 * Trigger: Expense Status Updated
 * Logic: If Status changes to 'Paid', notify the Creator
 */
export const onExpenseStatusChanged = functions
    .region('asia-southeast1')
    .firestore.document('expenses/{expenseId}')
    .onUpdate(async (change, context) => {
        const messaging = admin.messaging()

        const newData = change.after.data()
        const oldData = change.before.data()
        const orgId = newData.orgId

        // Check if status changed to Paid
        if (newData.status === 'Paid' && oldData.status !== 'Paid') {
            const creatorId = newData.createdBy
            if (!creatorId) return null

            // Notify Creator
            try {
                const tokens = await getUserTokens(creatorId)
                if (tokens.length === 0) return null

                const payload: admin.messaging.MulticastMessage = {
                    tokens: tokens,
                    notification: {
                        title: 'Expense Paid ✅',
                        body: `Your request "${newData.title}" has been paid.`,
                    },
                    data: {
                        type: 'EXPENSE_PAID',
                        expenseId: context.params.expenseId,
                        orgId: orgId || '',
                        url: '/finance'
                    },
                    android: { notification: { icon: 'stock_ticker_update', color: '#4caf50' } },
                    apns: { payload: { aps: { badge: 1, sound: 'default' } } }
                }

                await messaging.sendEachForMulticast(payload)
                return { success: true }
            } catch (error) {
                console.error("Error notifying expense creator", error)
                return null
            }
        }

        return null
    })

/**
 * Trigger: Income Created
 * Logic: Notify Admins
 */
export const onIncomeCreated = functions
    .region('asia-southeast1')
    .firestore.document('incomes/{incomeId}')
    .onCreate(async (snap, context) => {
        const messaging = admin.messaging()
        const income = snap.data()
        const orgId = income.orgId

        if (!orgId) return null

        try {
            const tokens = await getOrgAdminTokens(orgId)
            if (tokens.length === 0) return null

            const payload: admin.messaging.MulticastMessage = {
                tokens: tokens,
                notification: {
                    title: 'New Income Recorded 💰',
                    body: `${income.documentNumber} - ${income.total?.toLocaleString()} THB`,
                },
                data: {
                    type: 'INCOME',
                    incomeId: context.params.incomeId,
                    orgId: orgId,
                    url: '/finance/income'
                },
                android: { notification: { icon: 'stock_ticker_update', color: '#009688' } }, // Teal for income
                apns: { payload: { aps: { badge: 1, sound: 'default' } } }
            }

            await messaging.sendEachForMulticast(payload)
            return { success: true }

        } catch (error) {
            console.error("Error sending income notification", error)
            return null
        }
    })
