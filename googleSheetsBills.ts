import { getSheetsClient, getSpreadsheetId } from './googleClients';

const getBillsSheetName = () => process.env.GOOGLE_SHEETS_BILLS_SHEET_NAME || 'BillPayments';
const getHistorySheetName = () => process.env.GOOGLE_SHEETS_BILL_HISTORY_SHEET_NAME || 'BillPaymentHistory';

// BillPayments: BillId | Category | SubType | Identifier | Amount | Frequency | DueDate | LastPaidDate | Status | Notes | CreatedBy | CreatedAt | UpdatedAt | Label
const BILLS_HEADERS = ['BillId', 'Category', 'SubType', 'Identifier', 'Amount', 'Frequency', 'DueDate', 'LastPaidDate', 'Status', 'Notes', 'CreatedBy', 'CreatedAt', 'UpdatedAt', 'Label'];
const BILLS_RANGE_ALL = () => `${getBillsSheetName()}!A:N`;
const BILLS_RANGE_HEADER = () => `${getBillsSheetName()}!A1:N1`;

// BillPaymentHistory: PaymentId | BillId | Category | Identifier | Amount | PaidDate | PaidBy | Notes
const HISTORY_HEADERS = ['PaymentId', 'BillId', 'Category', 'Identifier', 'Amount', 'PaidDate', 'PaidBy', 'Notes'];
const HISTORY_RANGE_ALL = () => `${getHistorySheetName()}!A:H`;
const HISTORY_RANGE_HEADER = () => `${getHistorySheetName()}!A1:H1`;

export type BillCategory = 'Mobile' | 'Vehicle' | 'Electricity';
export type BillFrequency = 'Monthly' | 'Quarterly' | 'HalfYearly' | 'Annually' | 'OneTime';
export type BillStatus = 'Active' | 'Paused' | 'Completed';

export interface Bill {
  rowNumber: number;
  billId: string;
  category: BillCategory;
  subType: string;
  identifier: string;
  amount: number;
  frequency: BillFrequency;
  dueDate: string;
  lastPaidDate: string;
  status: BillStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  label: string;
}

export interface BillPayment {
  paymentId: string;
  billId: string;
  category: string;
  identifier: string;
  amount: number;
  paidDate: string;
  paidBy: string;
  notes: string;
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

async function ensureHeader(headerRange: string, headers: string[]): Promise<void> {
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

export async function ensureBillSheetsSetup(): Promise<void> {
  const billsTitle = getBillsSheetName();
  const historyTitle = getHistorySheetName();

  if (!(await sheetExists(billsTitle))) {
    await createSheetTab(billsTitle);
  }
  if (!(await sheetExists(historyTitle))) {
    await createSheetTab(historyTitle);
  }

  await ensureHeader(BILLS_RANGE_HEADER(), BILLS_HEADERS);
  await ensureHeader(HISTORY_RANGE_HEADER(), HISTORY_HEADERS);

  console.log('[Google Sheets Bills] BillPayments/BillPaymentHistory tabs ready.');
}

function rowToBill(row: any[], rowNumber: number): Bill {
  const [billId, category, subType, identifier, amount, frequency, dueDate, lastPaidDate, status, notes, createdBy, createdAt, updatedAt, label] = row;
  return {
    rowNumber,
    billId: billId || '',
    category: (category === 'Vehicle' || category === 'Electricity') ? category : 'Mobile',
    subType: subType || '',
    identifier: identifier || '',
    amount: amount ? Number(amount) : 0,
    frequency: ['Quarterly', 'HalfYearly', 'Annually', 'OneTime'].includes(frequency) ? frequency : 'Monthly',
    dueDate: dueDate || '',
    lastPaidDate: lastPaidDate || '',
    status: (status === 'Paused' || status === 'Completed') ? status : 'Active',
    notes: notes || '',
    createdBy: createdBy || '',
    createdAt: createdAt || '',
    updatedAt: updatedAt || '',
    label: label || '',
  };
}

async function getAllBills(): Promise<Bill[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: BILLS_RANGE_ALL(),
  });
  const rows = res.data.values || [];
  const bills: Bill[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || (i === 0 && row[0] === 'BillId')) continue;
    bills.push(rowToBill(row, i + 1));
  }
  return bills;
}

export async function listBills(category?: BillCategory): Promise<Bill[]> {
  const bills = await getAllBills();
  const filtered = category ? bills.filter((b) => b.category === category) : bills;
  return filtered.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}

export async function getBillById(billId: string): Promise<Bill | null> {
  const bills = await getAllBills();
  return bills.find((b) => b.billId === billId) || null;
}

export async function createBill(data: {
  category: BillCategory;
  subType?: string;
  identifier: string;
  amount: number;
  frequency: BillFrequency;
  dueDate: string;
  notes?: string;
  createdBy: string;
  label?: string;
}): Promise<Bill> {
  const sheets = await getSheetsClient();
  const billId = `BILL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const row = [
    billId,
    data.category,
    data.subType || '',
    data.identifier,
    data.amount,
    data.frequency,
    data.dueDate,
    '',
    'Active',
    data.notes || '',
    data.createdBy,
    now,
    now,
    data.label || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: BILLS_RANGE_ALL(),
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });

  return rowToBill(row, -1);
}

export async function updateBill(billId: string, updates: {
  subType?: string;
  identifier?: string;
  amount?: number;
  frequency?: BillFrequency;
  dueDate?: string;
  notes?: string;
  status?: BillStatus;
  label?: string;
}): Promise<Bill | null> {
  const bill = await getBillById(billId);
  if (!bill) return null;

  const sheets = await getSheetsClient();
  const now = new Date().toISOString();
  const merged: Bill = {
    ...bill,
    subType: updates.subType !== undefined ? updates.subType : bill.subType,
    identifier: updates.identifier !== undefined ? updates.identifier : bill.identifier,
    amount: updates.amount !== undefined ? updates.amount : bill.amount,
    frequency: updates.frequency !== undefined ? updates.frequency : bill.frequency,
    dueDate: updates.dueDate !== undefined ? updates.dueDate : bill.dueDate,
    notes: updates.notes !== undefined ? updates.notes : bill.notes,
    status: updates.status !== undefined ? updates.status : bill.status,
    label: updates.label !== undefined ? updates.label : bill.label,
    updatedAt: now,
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getBillsSheetName()}!C${bill.rowNumber}:N${bill.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        merged.subType,
        merged.identifier,
        merged.amount,
        merged.frequency,
        merged.dueDate,
        merged.lastPaidDate,
        merged.status,
        merged.notes,
        merged.createdBy,
        merged.createdAt,
        merged.updatedAt,
        merged.label,
      ]],
    },
  });

  return merged;
}

export async function deleteBill(billId: string): Promise<boolean> {
  const bill = await getBillById(billId);
  if (!bill) return false;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getBillsSheetName()}!A${bill.rowNumber}:N${bill.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [BILLS_HEADERS.map(() => '')] },
  });
  return true;
}

function addInterval(dateStr: string, frequency: BillFrequency): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  const date = new Date(base.getTime());
  switch (frequency) {
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'HalfYearly':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'Annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'OneTime':
      break;
  }
  return date.toISOString().slice(0, 10);
}

export async function markBillPaid(billId: string, paidBy: string, notes?: string): Promise<{ bill: Bill; payment: BillPayment } | null> {
  const bill = await getBillById(billId);
  if (!bill) return null;

  const sheets = await getSheetsClient();
  const paidDate = new Date().toISOString().slice(0, 10);
  const isOneTime = bill.frequency === 'OneTime';
  const nextDueDate = isOneTime ? bill.dueDate : addInterval(bill.dueDate, bill.frequency);
  const nextStatus: BillStatus = isOneTime ? 'Completed' : 'Active';
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getBillsSheetName()}!G${bill.rowNumber}:I${bill.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[nextDueDate, paidDate, nextStatus]] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${getBillsSheetName()}!M${bill.rowNumber}:M${bill.rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[now]] },
  });

  const paymentId = `PMT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const paymentRow = [paymentId, bill.billId, bill.category, bill.identifier, bill.amount, paidDate, paidBy, notes || ''];
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: HISTORY_RANGE_ALL(),
    valueInputOption: 'RAW',
    requestBody: { values: [paymentRow] },
  });

  const updatedBill: Bill = { ...bill, dueDate: nextDueDate, lastPaidDate: paidDate, status: nextStatus, updatedAt: now };
  const payment: BillPayment = {
    paymentId, billId: bill.billId, category: bill.category, identifier: bill.identifier,
    amount: bill.amount, paidDate, paidBy, notes: notes || '',
  };
  return { bill: updatedBill, payment };
}

export async function listBillHistory(billId?: string): Promise<BillPayment[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: HISTORY_RANGE_ALL(),
  });
  const rows = res.data.values || [];
  const payments: BillPayment[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || (i === 0 && row[0] === 'PaymentId')) continue;
    const [paymentId, rowBillId, category, identifier, amount, paidDate, paidBy, notes] = row;
    payments.push({
      paymentId, billId: rowBillId || '', category: category || '', identifier: identifier || '',
      amount: amount ? Number(amount) : 0, paidDate: paidDate || '', paidBy: paidBy || '', notes: notes || '',
    });
  }
  const filtered = billId ? payments.filter((p) => p.billId === billId) : payments;
  return filtered.sort((a, b) => b.paidDate.localeCompare(a.paidDate));
}
