"use strict";
/**
 * Telegram notification utilities for Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = sendTelegramMessage;
exports.formatExpenseNotification = formatExpenseNotification;
exports.formatPaymentDueReminder = formatPaymentDueReminder;
exports.formatTestMessage = formatTestMessage;
exports.formatQuotationNotification = formatQuotationNotification;
/**
 * Send a message to Telegram
 */
async function sendTelegramMessage(botToken, chatId, message) {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
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
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('Telegram API error:', data.description);
            return { success: false, error: data.description };
        }
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send Telegram message:', error);
        return { success: false, error: String(error) };
    }
}
/**
 * Format expense notification message
 */
function formatExpenseNotification(params) {
    const { projectName, subProjectName, itemName, amount, userName, date, status } = params;
    // Format amount with Thai Baht
    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    // Format date to Thai format
    const formattedDate = date;
    let message = `📢 <b>แจ้งเตือนการเบิกค่าใช้จ่าย</b>
-------------------------
📅 วันที่: ${formattedDate}
👷 โครงการ: ${projectName}`;
    if (subProjectName) {
        message += `\n🏗️ โปรเจคย่อย: ${subProjectName}`;
    }
    message += `
📝 รายการ: ${itemName}
💰 ยอดเงิน: ${formattedAmount} บาท
👤 ผู้เบิก: ${userName}
-------------------------
สถานะ: ${status}`;
    return message;
}
/**
 * Format payment due reminder message
 */
function formatPaymentDueReminder(params) {
    const { projectName, itemName, amount, dueDate, daysUntilDue } = params;
    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    const urgencyEmoji = daysUntilDue <= 1 ? '🔴' : daysUntilDue <= 3 ? '🟡' : '🟢';
    return `${urgencyEmoji} <b>แจ้งเตือนครบกำหนดชำระ</b>
-------------------------
👷 โครงการ: ${projectName}
📝 รายการ: ${itemName}
💰 ยอดเงิน: ${formattedAmount} บาท
📅 ครบกำหนด: ${dueDate}
⏰ เหลืออีก: ${daysUntilDue} วัน
-------------------------`;
}
/**
 * Format test connection message
 */
function formatTestMessage(orgName) {
    return `✅ <b>เชื่อมต่อสำเร็จ!</b>

🏢 องค์กร: ${orgName}
📱 ระบบแจ้งเตือน Telegram พร้อมใช้งาน

คุณจะได้รับการแจ้งเตือนเมื่อมีการสร้างรายจ่ายใหม่`;
}
/**
 * Format quotation notification message
 */
function formatQuotationNotification(params) {
    const { projectName, customerName, docNo, amount, userName, date } = params;
    const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    return `📑 <b>แจ้งเตือนใบเสนอราคาใหม่</b>
-------------------------
📄 เลขที่: ${docNo}
👷 โครงการ: ${projectName}
👤 ลูกค้า: ${customerName}
💰 ยอดรวม: ${formattedAmount} บาท
👤 ผู้ออกเอกสาร: ${userName}
📅 วันที่: ${date}
-------------------------`;
}
//# sourceMappingURL=telegram.js.map