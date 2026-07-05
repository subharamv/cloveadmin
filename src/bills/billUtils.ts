import { BillFrequency } from './api';

export const FREQUENCY_LABELS: Record<BillFrequency, string> = {
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  HalfYearly: 'Half-Yearly',
  Annually: 'Annually',
  OneTime: 'One-Time',
};

export const VEHICLE_BILL_TYPES = ['Insurance', 'Pollution (PUC)', 'Road Tax', 'Service & Maintenance', 'Fine / Challan', 'Other'];

export type DueStatus = 'overdue' | 'dueSoon' | 'upcoming';

export function getDueStatus(dueDate: string): DueStatus {
  if (!dueDate) return 'upcoming';
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'dueSoon';
  return 'upcoming';
}

export function formatDueDate(dueDate: string): string {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  return due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysUntil(dueDate: string): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const MONTH_ABBR: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// Converts APEPDCL's "18-JUN-2026" style date to a yyyy-mm-dd <input type="date"> value.
export function parseApepdclDate(value: string): string {
  const match = value.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return '';
  const [, day, monAbbr, year] = match;
  const month = MONTH_ABBR[monAbbr.toUpperCase()];
  if (!month) return '';
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

// Parses APEPDCL amount strings (may include commas) into a plain number.
export function parseApepdclAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

// Mirrors the backend's addInterval() in googleSheetsBills.ts — advances a
// yyyy-mm-dd date by one recurrence period.
export function addFrequencyInterval(dateStr: string, frequency: BillFrequency): string {
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
