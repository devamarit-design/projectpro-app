/**
 * Telegram notification utilities for Cloud Functions
 */

/**
 * Send a message to Telegram
 */
export async function sendTelegramMessage(
    botToken: string,
    chatId: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        })

        const data = await response.json()

        if (!data.ok) {
            console.error('Telegram API error:', data.description)
            return { success: false, error: data.description }
        }

        return { success: true }
    } catch (error) {
        console.error('Failed to send Telegram message:', error)
        return { success: false, error: String(error) }
    }
}

/**
 * Format expense notification message
 */
export function formatExpenseNotification(params: {
    projectName: string
    subProjectName?: string
    itemName: string
    amount: number
    userName: string
    date: string
    status: string
}): string {
    const { projectName, subProjectName, itemName, amount, userName, date, status } = params

    // Format amount with Thai Baht
    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)

    // Format date to Thai format
    const formattedDate = date

    let message = `📢 <b>แจ้งเตือนการเบิกค่าใช้จ่าย</b>
-------------------------
📅 วันที่: ${formattedDate}
👷 โครงการ: ${projectName}`

    if (subProjectName) {
        message += `\n🏗️ โปรเจคย่อย: ${subProjectName}`
    }

    message += `
📝 รายการ: ${itemName}
💰 ยอดเงิน: ${formattedAmount} บาท
👤 ผู้เบิก: ${userName}
-------------------------
สถานะ: ${status}`

    return message
}

/**
 * Format payment due reminder message
 */
export function formatPaymentDueReminder(params: {
    projectName: string
    itemName: string
    amount: number
    dueDate: string
    daysUntilDue: number
}): string {
    const { projectName, itemName, amount, dueDate, daysUntilDue } = params

    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)

    const urgencyEmoji = daysUntilDue <= 1 ? '🔴' : daysUntilDue <= 3 ? '🟡' : '🟢'

    return `${urgencyEmoji} <b>แจ้งเตือนครบกำหนดชำระ</b>
-------------------------
👷 โครงการ: ${projectName}
📝 รายการ: ${itemName}
💰 ยอดเงิน: ${formattedAmount} บาท
📅 ครบกำหนด: ${dueDate}
⏰ เหลืออีก: ${daysUntilDue} วัน
-------------------------`
}

/**
 * Format test connection message
 */
export function formatTestMessage(orgName: string): string {
    return `✅ <b>เชื่อมต่อสำเร็จ!</b>

🏢 องค์กร: ${orgName}
📱 ระบบแจ้งเตือน Telegram พร้อมใช้งาน

คุณจะได้รับการแจ้งเตือนเมื่อมีการสร้างรายจ่ายใหม่`
}

/**
 * Format quotation notification message
 */
export function formatQuotationNotification(params: {
    projectName: string
    customerName: string
    docNo: string
    amount: number
    userName: string
    date: string
}): string {
    const { projectName, customerName, docNo, amount, userName, date } = params

    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)

    return `📑 <b>แจ้งเตือนใบเสนอราคาใหม่</b>
-------------------------
📄 เลขที่: ${docNo}
👷 โครงการ: ${projectName}
👤 ลูกค้า: ${customerName}
💰 ยอดรวม: ${formattedAmount} บาท
👤 ผู้ออกเอกสาร: ${userName}
📅 วันที่: ${date}
-------------------------`
}

export function formatDailyTaskSummary(params: {
    date: string
    dateGroups: {
        dateLabel: string
        tasks: {
            title: string
            projectName: string
            assignee: string
            status: string
            dueDate: string
        }[]
    }[]
    overdueTasks: {
        title: string
        projectName: string
        assignee: string
        dueDate: string
        status: string
    }[]
}): string {
    const { date, dateGroups, overdueTasks } = params

    const hasTasks = dateGroups.length > 0 || overdueTasks.length > 0

    if (!hasTasks) {
        return `📅 <b>สรุปงานประจำวัน (${date})</b>
-------------------------
✅ ไม่มียอดคงเหลือ (No active tasks)`
    }

    let message = `📅 <b>สรุปงานประจำวัน (${date})</b>`

    // 1. Date Groups (Today -> Future)
    for (const group of dateGroups) {
        message += `\n\n📅 <b>${group.dateLabel}</b>`
        message += `\n-------------------------`
        for (const task of group.tasks) {
            // Extract Time
            let timeStr = ""
            try {
                if (task.dueDate && task.dueDate.includes("T")) {
                    const d = new Date(task.dueDate)
                    timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })
                    if (timeStr === "00:00") timeStr = "" // Don't show if midnight/default
                }
            } catch (e) { }

            message += `\n▫️ <b>${task.title}</b>`
            if (timeStr) message += ` (${timeStr})`

            message += `\n    🏗 ${task.projectName}`
            if (task.assignee) message += ` | 👤 ${task.assignee}`
            // message += ` | ${task.status}` // Optional: show status
        }
    }

    // 2. Overdue Tasks (At the end)
    if (overdueTasks.length > 0) {
        message += `\n\n⚠️ <b>งานที่เกินกำหนด (Overdue)</b>`
        message += `\n-------------------------`
        for (const task of overdueTasks) {
            const taskDate = new Date(task.dueDate)
            const dateStr = taskDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })

            message += `\n🔴 <b>${task.title}</b>`
            message += `\n    📅 ${dateStr} | 🏗 ${task.projectName}`
            if (task.assignee) message += ` | 👤 ${task.assignee}`
        }
    }

    message += `\n\n-------------------------
เปิดดูงานทั้งหมด: https://www.hipsloth.app/tasks`

    return message
}
