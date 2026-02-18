
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { orgId, type } = body

        if (!orgId) {
            return NextResponse.json({ success: false, error: 'Org ID required' }, { status: 400 })
        }

        // 1. Get Org Settings to find Telegram Config
        const orgDoc = await db.collection('organizations').doc(orgId).get()
        if (!orgDoc.exists) {
            return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
        }

        const orgData = orgDoc.data()
        const telegram = orgData?.settings?.telegram

        if (!telegram || !telegram.enabled || !telegram.botToken || !telegram.chatId) {
            return NextResponse.json({ success: false, error: 'Telegram not configured' }, { status: 400 })
        }

        // 2. Construct Message based on type
        let message = ""
        if (type === 'work') {
            message = `🔔 *Test Work Notification*\n\n` +
                `📋 *Task:* ลงเสาเข็ม (Test)\n` +
                `👷 *Assigned to:* คุณสมชาย\n` +
                `📅 *Due:* 25/02/2026\n\n` +
                `_This is a manual test notification sent from the app._`
        } else {
            message = `🔔 *Test Notification* \n\nThis is a test message from Hipsloth App.`
        }

        // 3. Send to Telegram
        const response = await fetch(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegram.chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        })

        const data = await response.json()

        if (!data.ok) {
            return NextResponse.json({ success: false, error: data.description }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Telegram API Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
