import bcrypt from 'bcryptjs';
import { getSheetsClient, getSpreadsheetId } from './googleClients';

const getSheetName = () => process.env.GOOGLE_SHEETS_SHEET_NAME || 'LoginAccounts';

// Columns: Email | PasswordHash | Role | CreatedAt | Name | Active
const getRange = () => `${getSheetName()}!A:F`;

export interface SheetUser {
  rowNumber: number;
  email: string;
  passwordHash: string;
  role: string;
  name: string;
  active: boolean;
}

export async function getAllUsers(): Promise<SheetUser[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: getRange(),
  });

  const rows = res.data.values || [];
  const users: SheetUser[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const [email, passwordHash, role, , name, active] = row;
    if (!email || (i === 0 && email.toLowerCase() === 'email')) continue;
    if (!passwordHash) continue;
    users.push({
      rowNumber: i + 1,
      email: String(email).trim(),
      passwordHash: String(passwordHash),
      role: role ? String(role) : 'Admin',
      name: name ? String(name) : '',
      active: active !== 'FALSE',
    });
  }

  return users;
}

export async function findUserByEmail(email: string): Promise<SheetUser | null> {
  const users = await getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function verifyCredentials(email: string, password: string): Promise<SheetUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!user.active) return null;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  return isMatch ? user : null;
}

export async function appendUser(email: string, plainPassword: string, role: string, name: string): Promise<void> {
  const sheets = await getSheetsClient();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const range = `${getSheetName()}!A:F`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[email, passwordHash, role, new Date().toISOString(), name, 'TRUE']],
    },
  });
}

export async function updateUser(email: string, updates: { role?: string; name?: string }): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;

  const sheets = await getSheetsClient();
  if (updates.role !== undefined) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${getSheetName()}!C${user.rowNumber}:C${user.rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[updates.role]] },
    });
  }
  if (updates.name !== undefined) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${getSheetName()}!E${user.rowNumber}:E${user.rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[updates.name]] },
    });
  }
  return true;
}

export async function deleteUser(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getSheetName()}!A${user.rowNumber}:F${user.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['', '', '', '', '', '']],
    },
  });
  return true;
}

export async function updatePassword(email: string, newPassword: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;

  const sheets = await getSheetsClient();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getSheetName()}!B${user.rowNumber}:B${user.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[passwordHash]],
    },
  });
  return true;
}

export async function setUserActive(email: string, active: boolean): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getSheetName()}!F${user.rowNumber}:F${user.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[active ? 'TRUE' : 'FALSE']],
    },
  });
  return true;
}

export async function ensureHeaderRow(): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${getSheetName()}!A1:F1`,
  });

  const expected = ['Email', 'PasswordHash', 'Role', 'CreatedAt', 'Name', 'Active'];
  const firstRow = res.data.values?.[0] || [];
  const isComplete = expected.every((label, i) => firstRow[i] === label);

  if (!isComplete) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${getSheetName()}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [expected],
      },
    });
  }
}

export async function seedAdminUserInSheet(email: string, plainPassword: string, role: string, name: string): Promise<void> {
  await ensureHeaderRow();
  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`[Google Sheets Auth] User "${email}" already exists in sheet.`);
    return;
  }
  await appendUser(email, plainPassword, role, name);
  console.log(`[Google Sheets Auth] Successfully seeded user: EMAIL="${email}" ROLE="${role}"`);
}
