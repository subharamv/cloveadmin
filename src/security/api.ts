import { getAuthToken } from '../lib/auth';

async function authedFetch(path: string, init?: RequestInit) {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', token);

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface VisitorMatch {
  phone: string;
  name: string;
}

export interface VisitorRecord {
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

export function searchVisitors(query: string): Promise<VisitorMatch[]> {
  return authedFetch(`/api/visitors/search?query=${encodeURIComponent(query)}`);
}

export function lookupVisitor(phone: string): Promise<{ found: boolean; visitor: VisitorRecord | null }> {
  return authedFetch(`/api/visitors/lookup/${encodeURIComponent(phone)}`);
}

export function submitVisitorEntry(formData: FormData): Promise<{ message: string; log: VisitorLog }> {
  return authedFetch('/api/visitors/entry', { method: 'POST', body: formData });
}

export function fetchActiveVisitors(): Promise<VisitorLog[]> {
  return authedFetch('/api/visitors/active');
}

export function markVisitorExit(logId: string): Promise<{ message: string; log: VisitorLog }> {
  return authedFetch('/api/visitors/exit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logId }),
  });
}

export function fetchVisitorLogs(params?: { search?: string; from?: string; to?: string }): Promise<VisitorLog[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qs = query.toString();
  return authedFetch(`/api/visitors/logs${qs ? `?${qs}` : ''}`);
}

export function createPreRegistration(data: {
  name: string;
  phone: string;
  purpose: string;
  host: string;
  expectedTime: string;
}): Promise<{ message: string; log: VisitorLog }> {
  return authedFetch('/api/visitors/preregister', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteVisitorLog(logId: string): Promise<{ message: string; count: number }> {
  return authedFetch('/api/visitors/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logId }),
  });
}

export function bulkDeleteVisitorLogs(logIds: string[]): Promise<{ message: string; count: number }> {
  return authedFetch('/api/visitors/bulk-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logIds }),
  });
}

export function fetchExpectedVisitors(): Promise<VisitorLog[]> {
  return authedFetch('/api/visitors/expected');
}

export function checkInVisitor(logId: string, photoFile: File): Promise<{ message: string; log: VisitorLog }> {
  const formData = new FormData();
  formData.set('logId', logId);
  formData.set('photoFile', photoFile);
  return authedFetch('/api/visitors/checkin', { method: 'POST', body: formData });
}

export function extractDriveFileId(driveLink: string): string | null {
  const match = driveLink.match(/\/file\/d\/([^/]+)/) || driveLink.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

export interface FetchedDriveFile {
  url: string;
  mimeType: string;
}

export async function fetchDriveFile(driveLink: string): Promise<FetchedDriveFile> {
  const fileId = extractDriveFileId(driveLink);
  if (!fileId) throw new Error('Invalid Drive link');

  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', token);

  const res = await fetch(`/api/visitors/file/${fileId}`, { headers });
  if (!res.ok) throw new Error(`Failed to load file (${res.status})`);

  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), mimeType: blob.type || res.headers.get('Content-Type') || '' };
}

export async function fetchDriveFileBlobUrl(driveLink: string): Promise<string> {
  const { url } = await fetchDriveFile(driveLink);
  return url;
}
