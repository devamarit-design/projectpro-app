import { google } from "googleapis";

export async function appendRowToSheet(
    sheetId: string,
    values: any[]
): Promise<void> {
    try {
        // Authenticate using the Service Account credentials
        const auth = new google.auth.GoogleAuth({
            keyFile: './service-account-key.json', // Path to your downloaded service account key
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client as any });

        // Dynamically get the first sheet's name instead of hardcoding "Sheet1"
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });

        const sheetsList = spreadsheet.data.sheets;
        if (!sheetsList || sheetsList.length === 0) {
            throw new Error("No sheets found in the spreadsheet.");
        }

        const firstSheetName = sheetsList[0].properties?.title || "Sheet1";
        console.log(`Using sheet name: "${firstSheetName}" for spreadsheet: ${sheetId}`);

        // Append the row to the first sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `'${firstSheetName}'!A:Q`, // Quoted sheet name is safer, extended to Q for Expense ID
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });

        console.log(`Successfully appended row to sheet: ${sheetId}`);
    } catch (error) {
        console.error(`Error appending row to sheet ${sheetId}:`, error);
        throw error;
    }
}

export async function updateRowInSheet(
    sheetId: string,
    expenseId: string,
    values: any[]
): Promise<void> {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './service-account-key.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client as any });

        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const sheetsList = spreadsheet.data.sheets;
        if (!sheetsList || sheetsList.length === 0) throw new Error("No sheets found.");

        const firstSheetName = sheetsList[0].properties?.title || "Sheet1";

        // Read column Q (index 16) to find the row with matching expenseId
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `'${firstSheetName}'!Q:Q`,
        });

        const rows = response.data.values;
        let rowIndex = -1;

        if (rows) {
            rowIndex = rows.findIndex(row => row[0] === expenseId);
        }

        // If not found, it might be an older expense, fallback to appending a new row
        if (rowIndex === -1) {
            console.log(`Expense ID ${expenseId} not found in sheet for update. Appending as new row.`);
            await appendRowToSheet(sheetId, values);
            return;
        }

        const rowNumber = rowIndex + 1; // Google Sheets is 1-indexed

        // Update the specific row
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `'${firstSheetName}'!A${rowNumber}:Q${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });

        console.log(`Successfully updated row ${rowNumber} in sheet: ${sheetId}`);
    } catch (error) {
        console.error(`Error updating row in sheet ${sheetId}:`, error);
        throw error;
    }
}
