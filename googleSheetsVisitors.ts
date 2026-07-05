import { getSheetsClient, getSpreadsheetId } from './googleClients';

const getVisitorsSheetName = () => process.env.GOOGLE_SHEETS_VISITORS_SHEET_NAME || 'Visitors';
const getLogsSheetName = () => process.env.GOOGLE_SHEETS_VISITOR_LOGS_SHEET_NAME || 'VisitorLogs';

// Visitors: Phone | Name | DocumentType | DocumentDriveLink | FolderDriveLink | CreatedAt | UpdatedAt | LastPhotoDriveLink
const VISITORS_HEADERS = ['Phone', 'Name', 'DocumentType', 'DocumentDriveLink', 'FolderDriveLink', 'CreatedAt', 'UpdatedAt', 'LastPhotoDriveLink'];
const VISITORS_RANGE_ALL = () => `${getVisitorsSheetName()}!A:H`;
const VISITORS_RANGE_HEADER = () => `${getVisitorsSheetName()}!A1:H1`;

// VisitorLogs: LogId | Phone | Name | EntryType | Purpose | DocumentType | DocumentDriveLink | PhotoDriveLink | VisitorIdCardNumber | EntryTime | ExitTime | Status | LoggedBy | Host | ExpectedTime
const LOGS_HEADERS = ['LogId', 'Phone', 'Name', 'EntryType', 'Purpose', 'DocumentType', 'DocumentDriveLink', 'PhotoDriveLink', 'VisitorIdCardNumber', 'EntryTime', 'ExitTime', 'Status', 'LoggedBy', 'Host', 'ExpectedTime'];
const LOGS_RANGE_ALL = () => `${getLogsSheetName()}!A:O`;
const LOGS_RANGE_HEADER = () => `${getLogsSheetName()}!A1:O1`;

export interface Visitor {
  rowNumber: number;
  phone: string;
  name: string;
  documentType: string;
  documentDriveLink: string;
  folderDriveLink: string;
  createdAt: string;
  updatedAt: string;
  lastPhotoDriveLink: string;
}

export interface VisitorLog {
  rowNumber: number;
  logId: string;
  phone: string;
  name: string;
  entryType: 'New' | 'Old';
  purpose: string;
  documentType: string;
  documentDriveLink: string;
  photoDriveLink: string;
  visitorIdCardNumber: string;
  entryTime: string;
  exitTime: string;
  status: 'Expected' | 'Active' | 'Completed';
  loggedBy: string;
  host: string;
  expectedTime: string;
}

async function sheetExists(title: string): Promise<boolean> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  return (meta.data.sheets || []).some((s) => s.properties?.title === title);
}

async function createSheetTab(title: string): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
}

async function ensureHeader(title: string, headerRange: string, headers: string[]): Promise<void> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: headerRange,
  });
  const firstRow = res.data.values?.[0];
  const matches = firstRow && headers.every((h, i) => firstRow[i] === h);
  if (!matches) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: headerRange,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

export async function ensureVisitorSheetsSetup(): Promise<void> {
  const visitorsTitle = getVisitorsSheetName();
  const logsTitle = getLogsSheetName();

  if (!(await sheetExists(visitorsTitle))) {
    await createSheetTab(visitorsTitle);
  }
  if (!(await sheetExists(logsTitle))) {
    await createSheetTab(logsTitle);
  }

  await ensureHeader(visitorsTitle, VISITORS_RANGE_HEADER(), VISITORS_HEADERS);
  await ensureHeader(logsTitle, LOGS_RANGE_HEADER(), LOGS_HEADERS);

  console.log('[Google Sheets Visitors] Visitors/VisitorLogs tabs ready.');
}

async function getAllVisitors(): Promise<Visitor[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: VISITORS_RANGE_ALL(),
  });
  const rows = res.data.values || [];
  const visitors: Visitor[] = [];
  for (let i = 0; i < rows.length; i++) {
    const [phone, name, documentType, documentDriveLink, folderDriveLink, createdAt, updatedAt, lastPhotoDriveLink] = rows[i];
    if (!phone || (i === 0 && phone === 'Phone')) continue;
    visitors.push({
      rowNumber: i + 1,
      phone: String(phone).trim(),
      name: name || '',
      documentType: documentType || '',
      documentDriveLink: documentDriveLink || '',
      folderDriveLink: folderDriveLink || '',
      createdAt: createdAt || '',
      updatedAt: updatedAt || '',
      lastPhotoDriveLink: lastPhotoDriveLink || '',
    });
  }
  return visitors;
}

export async function searchVisitorsByPhonePrefix(prefix: string): Promise<Array<{ phone: string; name: string }>> {
  if (!prefix) return [];
  const visitors = await getAllVisitors();
  return visitors
    .filter((v) => v.phone.includes(prefix))
    .slice(0, 5)
    .map((v) => ({ phone: v.phone, name: v.name }));
}

export async function findVisitorByPhone(phone: string): Promise<Visitor | null> {
  const visitors = await getAllVisitors();
  return visitors.find((v) => v.phone === phone.trim()) || null;
}

export async function upsertVisitor(data: {
  phone: string;
  name: string;
  documentType?: string;
  documentDriveLink?: string;
  folderDriveLink?: string;
  lastPhotoDriveLink?: string;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const existing = await findVisitorByPhone(data.phone);
  const now = new Date().toISOString();

  if (existing) {
    const values = [[
      data.phone,
      data.name,
      data.documentType || existing.documentType,
      data.documentDriveLink || existing.documentDriveLink,
      data.folderDriveLink || existing.folderDriveLink,
      existing.createdAt,
      now,
      data.lastPhotoDriveLink || existing.lastPhotoDriveLink,
    ]];
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${getVisitorsSheetName()}!A${existing.rowNumber}:H${existing.rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: VISITORS_RANGE_ALL(),
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data.phone,
          data.name,
          data.documentType || '',
          data.documentDriveLink || '',
          data.folderDriveLink || '',
          now,
          now,
          data.lastPhotoDriveLink || '',
        ]],
      },
    });
  }
}

function rowToLog(row: any[], rowNumber: number): VisitorLog {
  const [logId, phone, name, entryType, purpose, documentType, documentDriveLink, photoDriveLink, visitorIdCardNumber, entryTime, exitTime, status, loggedBy, host, expectedTime] = row;
  return {
    rowNumber,
    logId: logId || '',
    phone: phone || '',
    name: name || '',
    entryType: (entryType === 'Old' ? 'Old' : 'New'),
    purpose: purpose || '',
    documentType: documentType || '',
    documentDriveLink: documentDriveLink || '',
    photoDriveLink: photoDriveLink || '',
    visitorIdCardNumber: visitorIdCardNumber || '',
    entryTime: entryTime || '',
    exitTime: exitTime || '',
    status: (status === 'Expected' ? 'Expected' : status === 'Completed' ? 'Completed' : 'Active'),
    loggedBy: loggedBy || '',
    host: host || '',
    expectedTime: expectedTime || '',
  };
}

async function getAllLogs(): Promise<VisitorLog[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: LOGS_RANGE_ALL(),
  });
  const rows = res.data.values || [];
  const logs: VisitorLog[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || (i === 0 && row[0] === 'LogId')) continue;
    logs.push(rowToLog(row, i + 1));
  }
  return logs;
}

export async function appendLog(entry: {
  phone: string;
  name: string;
  entryType: 'New' | 'Old';
  purpose: string;
  documentType: string;
  documentDriveLink: string;
  photoDriveLink: string;
  visitorIdCardNumber: string;
  loggedBy: string;
}): Promise<VisitorLog> {
  const sheets = await getSheetsClient();
  const logId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const entryTime = new Date().toISOString();

  const row = [
    logId,
    entry.phone,
    entry.name,
    entry.entryType,
    entry.purpose,
    entry.documentType,
    entry.documentDriveLink,
    entry.photoDriveLink,
    entry.visitorIdCardNumber,
    entryTime,
    '',
    'Active',
    entry.loggedBy,
    '',
    '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: LOGS_RANGE_ALL(),
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });

  return rowToLog(row, -1);
}

export async function listActiveLogs(): Promise<VisitorLog[]> {
  const logs = await getAllLogs();
  return logs.filter((l) => l.status === 'Active').sort((a, b) => b.entryTime.localeCompare(a.entryTime));
}

export async function listLogs(filter?: { search?: string; from?: string; to?: string }): Promise<VisitorLog[]> {
  let logs = await getAllLogs();

  if (filter?.search) {
    const term = filter.search.toLowerCase();
    logs = logs.filter((l) => l.name.toLowerCase().includes(term) || l.phone.includes(term) || l.visitorIdCardNumber.toLowerCase().includes(term));
  }
  if (filter?.from) {
    logs = logs.filter((l) => l.entryTime >= filter.from!);
  }
  if (filter?.to) {
    logs = logs.filter((l) => l.entryTime <= filter.to!);
  }

  return logs.sort((a, b) => b.entryTime.localeCompare(a.entryTime));
}

export async function markExit(logId: string): Promise<VisitorLog | null> {
  const sheets = await getSheetsClient();
  const logs = await getAllLogs();
  const log = logs.find((l) => l.logId === logId);
  if (!log) return null;

  const exitTime = new Date().toISOString();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getLogsSheetName()}!K${log.rowNumber}:L${log.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[exitTime, 'Completed']] },
  });

  return { ...log, exitTime, status: 'Completed' };
}

export async function createPreRegistration(data: {
  name: string;
  phone: string;
  purpose: string;
  host: string;
  expectedTime: string;
  loggedBy: string;
}): Promise<VisitorLog> {
  const sheets = await getSheetsClient();
  const existing = data.phone ? await findVisitorByPhone(data.phone) : null;
  const logId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const row = [
    logId,
    data.phone,
    data.name || existing?.name || '',
    existing ? 'Old' : 'New',
    data.purpose,
    existing?.documentType || '',
    existing?.documentDriveLink || '',
    '',
    '',
    '',
    '',
    'Expected',
    data.loggedBy,
    data.host,
    data.expectedTime,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: LOGS_RANGE_ALL(),
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });

  return rowToLog(row, -1);
}

export async function listExpectedLogs(): Promise<VisitorLog[]> {
  const logs = await getAllLogs();
  return logs.filter((l) => l.status === 'Expected').sort((a, b) => a.expectedTime.localeCompare(b.expectedTime));
}

export async function deleteLogRows(logIds: string[]): Promise<number> {
  const sheets = await getSheetsClient();
  const logs = await getAllLogs();
  const toDelete = logs.filter((l) => logIds.includes(l.logId));
  if (toDelete.length === 0) return 0;
  // Sort descending by rowNumber so deletion from bottom up doesn't shift indices
  const sorted = toDelete.sort((a, b) => b.rowNumber - a.rowNumber);
  for (const log of sorted) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${getLogsSheetName()}!A${log.rowNumber}:O${log.rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [LOGS_HEADERS.map(() => '')] },
    });
  }
  return toDelete.length;
}

export async function checkInLog(logId: string, photoDriveLink: string): Promise<VisitorLog | null> {
  const sheets = await getSheetsClient();
  const logs = await getAllLogs();
  const log = logs.find((l) => l.logId === logId);
  if (!log || log.status !== 'Expected') return null;

  const entryTime = new Date().toISOString();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getLogsSheetName()}!H${log.rowNumber}:H${log.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[photoDriveLink]] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getLogsSheetName()}!J${log.rowNumber}:L${log.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[entryTime, '', 'Active']] },
  });

  return { ...log, photoDriveLink, entryTime, status: 'Active' };
}
