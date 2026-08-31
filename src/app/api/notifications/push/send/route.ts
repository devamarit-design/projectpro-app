
import { NextResponse } from 'next/server'
import { db, messaging } from '@/lib/firebase-admin'
import { authErrorResponse, requireAuthenticatedUser, requireOrganizationAccess } from '@/lib/api-auth'

export async function POST(req: Request) {
    try {
        await requireAuthenticatedUser(req)
        const { userIds, title, body, url, data, orgId } = await req.json()

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ message: 'No user IDs provided' }, { status: 400 })
        }

        const { memberIds } = await requireOrganizationAccess(req, orgId)
        if (userIds.some((userId: unknown) => typeof userId !== 'string' || !memberIds.includes(userId))) {
            return NextResponse.json({ error: 'Notification recipients must belong to this organization' }, { status: 403 })
        }

        if (!messaging) {
            return NextResponse.json({ message: 'Firebase Messaging not initialized' }, { status: 500 })
        }

        // 1. Fetch FCM Tokens for all users
        const tokens: string[] = []

        // Helper to fetch tokens for a chunk of users
        const fetchTokens = async (ids: string[]) => {
            // Firestore 'in' query is limited to 10
            const chunks = []
            for (let i = 0; i < ids.length; i += 10) {
                chunks.push(ids.slice(i, i + 10))
            }

            for (const chunk of chunks) {
                const usersSnap = await db.collection('users').where('id', 'in', chunk).get()
                usersSnap.forEach(doc => {
                    const userData = doc.data()
                    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                        tokens.push(...userData.fcmTokens)
                    }
                })
            }
        }

        await fetchTokens(userIds)

        if (tokens.length === 0) {
            return NextResponse.json({ message: 'No registered tokens found for these users' })
        }

        // 2. Send Multicast Message
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                url: url || '/',
                ...data
            },
            tokens: tokens
        }

        const response = await messaging.sendEachForMulticast(message)

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        })

    } catch (error: any) {
        const authResponse = authErrorResponse(error)
        if (authResponse) return authResponse
        console.error('Error sending push:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
