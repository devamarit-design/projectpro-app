import { google } from "googleapis";
import { Readable } from "stream";

// Initialize Google Drive client using OAuth2 (to leverage user's personal storage quota)
export async function getDriveClient(credentials: { clientId: string, clientSecret: string, refreshToken: string }) {
    try {
        const oauth2Client = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret,
            'postmessage' // Special value for GSI/OAuth2 code client
        );

        oauth2Client.setCredentials({
            refresh_token: credentials.refreshToken
        });

        return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
        console.error("Error initializing Google Drive client via OAuth2:", error);
        throw error;
    }
}

export async function ensureFolderExists(drive: any, folderName: string, parentId?: string): Promise<string> {
    try {
        let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentId) {
            // Service accounts don't have a normal "My Drive", so we always need a parent ID
            // from the folder the user shared with the service account.
            q += ` and '${parentId}' in parents`;
        }

        const res = await drive.files.list({
            q: q,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            console.log(`Folder '${folderName}' already exists.`);
            return res.data.files[0].id;
        }

        console.log(`Creating folder '${folderName}'...`);
        const fileMetadata: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const folder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return folder.data.id;
    } catch (err) {
        console.error('Error ensuring folder exists:', err);
        throw err;
    }
}

export async function uploadFileToDrive(drive: any, fileBuffer: Buffer, fileName: string, mimeType: string, parentId: string): Promise<string> {
    try {
        const fileMetadata: any = {
            name: fileName,
            parents: [parentId] // Always require a parentId for Service Account uploads to be visible to the user
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        console.log(`Successfully uploaded file: ${fileName}`);
        return file.data.id;
    } catch (err) {
        console.error('Error uploading file to Drive:', err);
        throw err;
    }
}

export async function checkFolderAccess(drive: any, folderId: string): Promise<{ success: boolean; name?: string; error?: string }> {
    try {
        const response = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, mimeType',
        });

        const file = response.data;
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            return { success: true, name: file.name };
        } else {
            return { success: false, error: 'The provided ID is a file, not a folder.' };
        }
    } catch (err: any) {
        console.error('Error checking folder access:', err);
        if (err.status === 404) {
            return { success: false, error: 'Folder not found or not shared with the bot email. Please make sure the ID is correct and you shared it.' };
        }
        return { success: false, error: err.message || 'An unknown error occurred while verifying the folder.' };
    }
}
