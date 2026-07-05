import { getAuthToken } from '../lib/auth';

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

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: token } : {};
}

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function fetchBills(category?: BillCategory): Promise<Bill[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`/api/bills${query}`, { headers: authHeaders() });
  return parseJsonOrThrow(res);
}

export async function createBill(payload: {
  category: BillCategory;
  subType?: string;
  identifier: string;
  amount: number;
  frequency: BillFrequency;
  dueDate: string;
  notes?: string;
  label?: string;
}): Promise<Bill> {
  const res = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res);
  return data.bill;
}

export async function updateBill(billId: string, updates: Partial<{
  subType: string;
  identifier: string;
  amount: number;
  frequency: BillFrequency;
  dueDate: string;
  notes: string;
  status: BillStatus;
  label: string;
}>): Promise<Bill> {
  const res = await fetch(`/api/bills/${encodeURIComponent(billId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  const data = await parseJsonOrThrow(res);
  return data.bill;
}

export async function deleteBill(billId: string): Promise<void> {
  const res = await fetch(`/api/bills/${encodeURIComponent(billId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parseJsonOrThrow(res);
}

export async function markBillPaid(billId: string, notes?: string): Promise<{ bill: Bill; payment: BillPayment }> {
  const res = await fetch(`/api/bills/${encodeURIComponent(billId)}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ notes }),
  });
  return parseJsonOrThrow(res);
}

export async function fetchBillHistory(billId: string): Promise<BillPayment[]> {
  const res = await fetch(`/api/bills/${encodeURIComponent(billId)}/history`, { headers: authHeaders() });
  return parseJsonOrThrow(res);
}

export async function fetchAllBillHistory(category?: BillCategory): Promise<BillPayment[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`/api/bills/history${query}`, { headers: authHeaders() });
  return parseJsonOrThrow(res);
}

export interface ApepdclBillData {
  serviceNumber: string;
  consumerName: string;
  category: string;
  address: string;
  sectionOffice: string;
  ero: string;
  billDate: string;
  dueDate: string;
  dateOfDisconnection: string;
  presentBillAmount: string;
  totalAmountToPay: string;
}

export async function startApepdclLookup(serviceNumber: string): Promise<{ sessionId: string; captchaImage: string }> {
  const res = await fetch('/api/bills/apepdcl/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ serviceNumber }),
  });
  return parseJsonOrThrow(res);
}

export async function refreshApepdclCaptcha(sessionId: string): Promise<{ captchaImage: string }> {
  const res = await fetch('/api/bills/apepdcl/refresh-captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sessionId }),
  });
  return parseJsonOrThrow(res);
}

export type ApepdclVerifyResult =
  | { status: 'success'; bill: ApepdclBillData }
  | { status: 'invalid_captcha'; captchaImage: string }
  | { status: 'otp_required' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export async function verifyApepdclCaptcha(sessionId: string, captchaText: string): Promise<ApepdclVerifyResult> {
  const res = await fetch('/api/bills/apepdcl/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sessionId, captchaText }),
  });
  return parseJsonOrThrow(res);
}

export async function cancelApepdclSession(sessionId: string): Promise<void> {
  await fetch('/api/bills/apepdcl/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sessionId }),
  });
}
