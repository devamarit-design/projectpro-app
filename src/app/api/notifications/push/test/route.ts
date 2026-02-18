
import { NextResponse } from 'next/server'
import { db, messaging } from '@/lib/firebase-admin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, title, body: messageBody } = body

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }

        // 1. Get User's Tokens
        const userDoc = await db.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        const userData = userDoc.data()
        const tokens = userData?.fcmTokens as string[]

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ success: false, error: 'No FCM tokens found for user' }, { status: 404 })
        }

        // 2. Send Multicast Message
        const message = {
            notification: {
                title: title || 'Test Push Notification',
                body: messageBody || 'This is a test notification from Hipsloth.',
            },
            data: {
                url: '/settings' // Action URL
            },
            tokens: tokens
        }

        const response = await messaging.sendEachForMulticast(message)

        // 3. Cleanup invalid tokens (Optional but recommended)
        if (response.failureCount > 0) {
            const failedTokens: string[] = []
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx])
                }
            })
            // In a real app, you would remove these failed tokens from Firestore here
            console.log("Failed tokens:", failedTokens)
        }

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        })

    } catch (error: any) {
        console.error("Push API Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
