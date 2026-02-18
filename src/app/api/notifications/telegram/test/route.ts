
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'


import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { format, isPast, isToday, parseISO, isValid } from 'date-fns'
import { th } from 'date-fns/locale'

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

        // 2. Fetch Active Tasks
        const tasksSnapshot = await db.collection('tasks')
            .where('orgId', '==', orgId)
            // .where('status', '!=', 'Done') // Firestore limitation: != Done might require index if combined with other sorts
            // for simplicity, fetch all and filter in memory since dataset is small for typical orgs
            .get()

        const overdue: any[] = []
        const dueToday: any[] = []
        const inProgress: any[] = []

        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize to start of day for comparison

        tasksSnapshot.forEach(doc => {
            const task = doc.data()
            if (task.status === 'Done' || task.isArchived) return

            // Check In Progress
            if (task.status === 'In Progress') {
                inProgress.push(task)
            }

            // Check Dates
            if (task.dueDate) {
                const dueDate = parseISO(task.dueDate)
                if (isValid(dueDate)) {
                    // Set dueDate time to end of day to be lenient, or start of day to be strict?
                    // Usually "Due Date" means "By end of this day".
                    // Let's compare Date parts only.
                    const dueDay = new Date(dueDate)
                    dueDay.setHours(0, 0, 0, 0)

                    if (dueDay.getTime() === today.getTime()) {
                        dueToday.push(task)
                    } else if (dueDay < today) {
                        overdue.push(task)
                    }
                }
            }
        })

        // 3. Helper to format list
        const formatTaskList = (tasks: any[], limit: number = 5) => {
            if (tasks.length === 0) return "   _(No tasks)_"
            let list = tasks.slice(0, limit).map(t => `   • ${t.title}`).join("\n")
            if (tasks.length > limit) {
                list += `\n   ...and ${tasks.length - limit} more`
            }
            return list
        }

        // 4. Construct Message
        let message = `🔔 *Daily Task Summary* 🔔\n` +
            `📅 *${format(new Date(), 'dd MMMM yyyy', { locale: th })}*\n\n`

        // 🚨 Overdue
        message += `🚨 *Overdue Tasks (${overdue.length})*\n`
        message += formatTaskList(overdue) + "\n\n"

        // ⚠️ Due Today
        message += `⚠️ *Due Today (${dueToday.length})*\n`
        message += formatTaskList(dueToday) + "\n\n"

        // 🚧 In Progress - as requested by user
        message += `🚧 *In Progress (${inProgress.length})*\n`
        message += formatTaskList(inProgress) + "\n\n"

        message += `_Check the app for details._`


        // 5. Send to Telegram
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
            console.error("Telegram Send Error:", data)
            return NextResponse.json({ success: false, error: data.description }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Telegram API Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

