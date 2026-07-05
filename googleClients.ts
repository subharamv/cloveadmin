import { google } from 'googleapis';
import fs from 'fs';

// Read lazily rather than at module-load time: this module can be imported
// before dotenv.config() runs (ES module imports execute before the rest of
// the importing file's top-level code), which would otherwise capture "".
export const getSpreadsheetId = () => process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
export const getCredentialsPath = () => process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
export const getDriveRootFolderId = () => process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

let authClientPromise: ReturnType<typeof buildAuthClient> | null = null;

async function buildAuthClient() {
  const credentialsPath = getCredentialsPath();
  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    throw new Error(`Google service account credentials file not found at "${credentialsPath}"`);
  }

  const key = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: key.client_email,
      private_key: key.private_key,
    },
    scopes: SCOPES,
  });
  return auth.getClient();
}

async function getAuthClient() {
  if (!authClientPromise) {
    authClientPromise = buildAuthClient();
  }
  return authClientPromise;
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const authClient = await getAuthClient();
  sheetsClient = google.sheets({ version: 'v4', auth: authClient as any });
  return sheetsClient;
}

let driveClient: ReturnType<typeof google.drive> | null = null;

export async function getDriveClient() {
  if (driveClient) return driveClient;
  const authClient = await getAuthClient();
  driveClient = google.drive({ version: 'v3', auth: authClient as any });
  return driveClient;
}
