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

        // Append the row to "Sheet1"
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:P', // We have 16 columns matching the CSV fields
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
