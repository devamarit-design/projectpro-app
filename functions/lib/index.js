"use strict";
/**
 * Cloud Functions for ProjectPro App
 * Telegram Notification System
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyTaskSummary = exports.sendPaymentDueReminders = exports.testTelegramConnection = exports.sendQuotationNotification = exports.sendExpenseNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const telegram_1 = require("./telegram");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Region for deployment (Asia)
const region = 'asia-southeast1';
/**
 * Send expense notification to Telegram
 * Called from client after expense is created
 */
exports.sendExpenseNotification = functions
    .region(region)
    .https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { orgId, expense } = data;
    if (!orgId || !expense) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing orgId or expense data');
    }
    try {
        // Get organization settings
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        if (!orgDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Organization not found');
        }
        const orgData = orgDoc.data();
        const telegramSettings = (_a = orgData === null || orgData === void 0 ? void 0 : orgData.settings) === null || _a === void 0 ? void 0 : _a.telegram;
        // Check if telegram is enabled
        if (!(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.enabled) || !(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.notifyOnExpense)) {
            return { success: true, skipped: true, reason: 'Telegram notifications disabled' };
        }
        const { botToken, chatId } = telegramSettings;
        if (!botToken || !chatId) {
            return { success: false, error: 'Bot token or chat ID not configured' };
        }
        // Format and send message
        const message = (0, telegram_1.formatExpenseNotification)({
            projectName: expense.projectName || 'ไม่ระบุโครงการ',
            subProjectName: expense.subProjectName,
            itemName: expense.itemName || 'ไม่ระบุรายการ',
            amount: expense.amount || 0,
            userName: expense.userName || 'ไม่ระบุผู้ใช้',
            date: expense.date || new Date().toISOString().split('T')[0],
            status: expense.status || 'PENDING'
        });
        const result = await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
        return result;
    }
    catch (error) {
        console.error('Error sending expense notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send notification');
    }
});
/**
 * Send quotation notification to Telegram
 * Called from client after quotation is created
 */
exports.sendQuotationNotification = functions
    .region(region)
    .https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { orgId, quotation } = data;
    if (!orgId || !quotation) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing orgId or quotation data');
    }
    try {
        // Get organization settings
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        if (!orgDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Organization not found');
        }
        const orgData = orgDoc.data();
        const telegramSettings = (_a = orgData === null || orgData === void 0 ? void 0 : orgData.settings) === null || _a === void 0 ? void 0 : _a.telegram;
        // Check if telegram is enabled
        if (!(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.enabled) || !(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.notifyOnQuotation)) {
            return { success: true, skipped: true, reason: 'Telegram notifications disabled or quotation notification disabled' };
        }
        const { botToken, chatId } = telegramSettings;
        if (!botToken || !chatId) {
            return { success: false, error: 'Bot token or chat ID not configured' };
        }
        // Format and send message
        const message = (0, telegram_1.formatQuotationNotification)({
            projectName: quotation.projectName || 'ไม่ระบุโครงการ',
            customerName: quotation.customerName || 'ทั่วไป',
            docNo: quotation.docNo || 'N/A',
            amount: quotation.amount || 0,
            userName: quotation.userName || 'ไม่ระบุผู้ใช้',
            date: quotation.date || new Date().toISOString().split('T')[0]
        });
        const result = await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
        return result;
    }
    catch (error) {
        console.error('Error sending quotation notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send notification');
    }
});
/**
 * Test Telegram connection
 * Only accessible by organization owner
 */
exports.testTelegramConnection = functions
    .region(region)
    .https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { orgId, botToken, chatId } = data;
    if (!orgId || !botToken || !chatId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        // Verify user is owner of the organization
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        if (!orgDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Organization not found');
        }
        const orgData = orgDoc.data();
        // Check if user is owner
        if ((orgData === null || orgData === void 0 ? void 0 : orgData.ownerId) !== context.auth.uid) {
            // Also check members array for Owner role
            const member = (_a = orgData === null || orgData === void 0 ? void 0 : orgData.members) === null || _a === void 0 ? void 0 : _a.find((m) => { var _a; return m.userId === ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid); });
            if (!member || member.role !== 'Owner') {
                throw new functions.https.HttpsError('permission-denied', 'Only organization owner can test Telegram connection');
            }
        }
        // Send test message
        const orgName = (orgData === null || orgData === void 0 ? void 0 : orgData.name) || 'Unknown Organization';
        const message = (0, telegram_1.formatTestMessage)(orgName);
        const result = await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
        return result;
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error testing Telegram connection:', error);
        throw new functions.https.HttpsError('internal', 'Failed to test connection');
    }
});
/**
 * Scheduled function to send payment due reminders
 * Runs daily at 9:00 AM Bangkok time
 */
exports.sendPaymentDueReminders = functions
    .region(region)
    .pubsub.schedule('0 9 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
    var _a, _b;
    console.log('Running payment due reminders...');
    try {
        // Get all organizations with telegram enabled
        const orgsSnapshot = await db.collection('organizations').get();
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const telegramSettings = (_a = orgData === null || orgData === void 0 ? void 0 : orgData.settings) === null || _a === void 0 ? void 0 : _a.telegram;
            // Skip if telegram not enabled or payment due notifications disabled
            if (!(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.enabled) || !(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.notifyOnPaymentDue)) {
                continue;
            }
            const { botToken, chatId, paymentDueDays = 3 } = telegramSettings;
            if (!botToken || !chatId) {
                continue;
            }
            // Get expenses that are due within the specified days
            const today = new Date();
            const dueDate = new Date();
            dueDate.setDate(today.getDate() + paymentDueDays);
            const expensesSnapshot = await db
                .collection('expenses')
                .where('organizationId', '==', orgDoc.id)
                .where('status', '==', 'PENDING')
                .get();
            for (const expenseDoc of expensesSnapshot.docs) {
                const expense = expenseDoc.data();
                // Check if expense has a due date
                if (!expense.dueDate)
                    continue;
                const expenseDueDate = new Date(expense.dueDate);
                const daysUntilDue = Math.ceil((expenseDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                // Send reminder if due within specified days
                if (daysUntilDue >= 0 && daysUntilDue <= paymentDueDays) {
                    // Get project name
                    let projectName = 'ไม่ระบุโครงการ';
                    if (expense.projectId) {
                        const projectDoc = await db
                            .collection('projects')
                            .doc(expense.projectId)
                            .get();
                        if (projectDoc.exists) {
                            projectName = ((_b = projectDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || projectName;
                        }
                    }
                    const message = (0, telegram_1.formatPaymentDueReminder)({
                        projectName,
                        itemName: expense.name || 'ไม่ระบุรายการ',
                        amount: expense.totalValue || 0,
                        dueDate: expense.dueDate,
                        daysUntilDue
                    });
                    await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
                }
            }
        }
        console.log('Payment due reminders completed');
        return null;
    }
    catch (error) {
        console.error('Error sending payment due reminders:', error);
        return null;
    }
});
/**
 * Scheduled function to send daily task summary
 * Runs daily at 8:00 AM Bangkok time
 */
exports.sendDailyTaskSummary = functions
    .region(region)
    .pubsub.schedule('0 8 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
    var _a, _b;
    console.log('Running daily task summary...');
    try {
        // Get all organizations with telegram enabled
        const orgsSnapshot = await db.collection('organizations').get();
        const today = new Date();
        // Format date for display (e.g., 23 Jan 2026)
        const dateDisplay = today.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        // Calculate start and end of today in local time for query
        // Providing a simplified check: check due date string if stored as YYYY-MM-DD
        const todayStr = today.toISOString().split('T')[0];
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const telegramSettings = (_a = orgData === null || orgData === void 0 ? void 0 : orgData.settings) === null || _a === void 0 ? void 0 : _a.telegram;
            // Skip if disabled
            if (!(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.enabled) || !(telegramSettings === null || telegramSettings === void 0 ? void 0 : telegramSettings.notifyOnDailyTasks)) {
                continue;
            }
            const { botToken, chatId } = telegramSettings;
            if (!botToken || !chatId) {
                continue;
            }
            // Query tasks due today
            // Note: Assuming 'dueDate' is stored as YYYY-MM-DD string or timestamp?
            // Based on payment reminder, it seems DATE string YYYY-MM-DD
            const tasksSnapshot = await db
                .collection('tasks')
                .where('organizationId', '==', orgDoc.id)
                .where('dueDate', '==', todayStr)
                .where('status', '!=', 'done') // Only active tasks
                .get();
            if (tasksSnapshot.empty) {
                const message = (0, telegram_1.formatDailyTaskSummary)({
                    date: dateDisplay,
                    tasks: []
                });
                await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
                continue;
            }
            // Group tasks by project
            const tasksByProject = {};
            const projectNames = {};
            const userNames = {}; // Cache user names
            for (const taskDoc of tasksSnapshot.docs) {
                const task = taskDoc.data();
                const projectId = task.projectId || 'unknown';
                // Fetch Project Name if not cached
                if (!projectNames[projectId]) {
                    if (projectId === 'unknown') {
                        projectNames[projectId] = 'ไม่ระบุโครงการ';
                    }
                    else {
                        const pDoc = await db.collection('projects').doc(projectId).get();
                        projectNames[projectId] = ((_b = pDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || 'ไม่ระบุโครงการ';
                    }
                }
                // Fetch Assignee Name if not cached
                let assigneeName = '';
                if (task.assigneeId) {
                    if (userNames[task.assigneeId]) {
                        assigneeName = userNames[task.assigneeId];
                    }
                    else {
                        const uDoc = await db.collection('users').doc(task.assigneeId).get();
                        // Try to get from user profile or member list name? 
                        // Using displayName from user doc
                        const userData = uDoc.data();
                        assigneeName = (userData === null || userData === void 0 ? void 0 : userData.displayName) || (userData === null || userData === void 0 ? void 0 : userData.name) || 'Unknown';
                        userNames[task.assigneeId] = assigneeName;
                    }
                }
                if (!tasksByProject[projectId]) {
                    tasksByProject[projectId] = [];
                }
                tasksByProject[projectId].push({
                    title: task.title || 'Untitled Task',
                    assignee: assigneeName
                });
            }
            // Transform to array for formatter
            const groupedTasks = Object.keys(tasksByProject).map(projectId => ({
                projectName: projectNames[projectId],
                tasks: tasksByProject[projectId]
            }));
            const message = (0, telegram_1.formatDailyTaskSummary)({
                date: dateDisplay,
                tasks: groupedTasks
            });
            await (0, telegram_1.sendTelegramMessage)(botToken, chatId, message);
        }
        return null;
    }
    catch (error) {
        console.error('Error sending daily task summary:', error);
        return null;
    }
});
//# sourceMappingURL=index.js.map