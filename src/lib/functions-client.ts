/**
 * Firebase Cloud Functions client wrapper
 * Used to call Cloud Functions from the client
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { app } from './firebase'

// Initialize Functions with Asia region
const functions = getFunctions(app, 'asia-southeast1')

// Connect to emulator in development (uncomment for local testing)
// if (process.env.NODE_ENV === 'development') {
//     connectFunctionsEmulator(functions, 'localhost', 5001)
// }

// Type definitions
interface ExpenseNotificationData {
    orgId: string
    expense: {
        projectName: string
        subProjectName?: string
        itemName: string
        amount: number
        userName: string
        date: string
        status: string
    }
}

interface TestConnectionData {
    orgId: string
    botToken: string
    chatId: string
}

interface TelegramResult {
    success: boolean
    error?: string
    skipped?: boolean
    reason?: string
}

/**
 * Send expense notification via Cloud Function
 */
export const sendExpenseNotification = async (
    data: ExpenseNotificationData
): Promise<TelegramResult> => {
    try {
        const callable = httpsCallable<ExpenseNotificationData, TelegramResult>(
            functions,
            'sendExpenseNotification'
        )
        const result = await callable(data)
        return result.data
    } catch (error) {
        console.error('Error calling sendExpenseNotification:', error)
        return { success: false, error: String(error) }
    }
}

/**
 * Test Telegram connection via Cloud Function
 */
export const testTelegramConnection = async (
    data: TestConnectionData
): Promise<TelegramResult> => {
    try {
        const callable = httpsCallable<TestConnectionData, TelegramResult>(
            functions,
            'testTelegramConnection'
        )
        const result = await callable(data)
        return result.data
    } catch (error) {
        console.error('Error calling testTelegramConnection:', error)
        return { success: false, error: String(error) }
    }
}

interface QuotationNotificationData {
    orgId: string
    quotation: {
        projectName: string
        customerName: string
        docNo: string
        amount: number
        userName: string
        date: string
    }
}

/**
 * Send quotation notification via Cloud Function
 */
export const sendQuotationNotification = async (
    data: QuotationNotificationData
): Promise<TelegramResult> => {
    try {
        const callable = httpsCallable<QuotationNotificationData, TelegramResult>(
            functions,
            'sendQuotationNotification'
        )
        const result = await callable(data)
        return result.data
    } catch (error) {
        console.error('Error calling sendQuotationNotification:', error)
        return { success: false, error: String(error) }
    }
}
