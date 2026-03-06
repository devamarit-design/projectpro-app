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
            range: `'${firstSheetName}'!A:P`, // Quoted sheet name is safer
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
