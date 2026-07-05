import { getDriveClient, getDriveRootFolderId } from './googleClients';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function sanitizeForName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

async function findChildFolder(parentId: string, name: string): Promise<string | null> {
  const drive = await getDriveClient();
  const escapedName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives',
  });
  return res.data.files?.[0]?.id || null;
}

async function createChildFolder(parentId: string, name: string): Promise<string> {
  const drive = await getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });
  if (!res.data.id) throw new Error(`Failed to create Drive folder "${name}"`);
  return res.data.id;
}

async function ensureChildFolder(parentId: string, name: string): Promise<string> {
  const existing = await findChildFolder(parentId, name);
  if (existing) return existing;
  return createChildFolder(parentId, name);
}

export interface VisitorFolderRefs {
  visitorFolderId: string;
  documentFolderId: string;
  photoFolderId: string;
  folderDriveLink: string;
}

export async function ensureVisitorFolder(name: string, phone: string): Promise<VisitorFolderRefs> {
  const rootFolderId = getDriveRootFolderId();
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
  }

  const folderName = `${sanitizeForName(name)}_${sanitizeForName(phone)}`;
  const visitorFolderId = await ensureChildFolder(rootFolderId, folderName);
  const documentFolderId = await ensureChildFolder(visitorFolderId, 'document');
  const photoFolderId = await ensureChildFolder(visitorFolderId, 'photo logs');

  return {
    visitorFolderId,
    documentFolderId,
    photoFolderId,
    folderDriveLink: `https://drive.google.com/drive/folders/${visitorFolderId}`,
  };
}

export interface UploadedFile {
  fileId: string;
  webViewLink: string;
}

export async function uploadFile(
  parentFolderId: string,
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<UploadedFile> {
  const drive = await getDriveClient();
  const { Readable } = await import('stream');

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [parentFolderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  if (!res.data.id) throw new Error(`Failed to upload file "${filename}" to Drive`);

  return {
    fileId: res.data.id,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

export interface DownloadedFile {
  mimeType: string;
  buffer: Buffer;
}

export async function downloadFile(fileId: string): Promise<DownloadedFile> {
  const drive = await getDriveClient();

  const metaRes = await drive.files.get({
    fileId,
    fields: 'mimeType',
    supportsAllDrives: true,
  });

  const mediaRes = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );

  return {
    mimeType: metaRes.data.mimeType || 'application/octet-stream',
    buffer: Buffer.from(mediaRes.data as ArrayBuffer),
  };
}
