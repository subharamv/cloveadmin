import express from 'express';
import multer from 'multer';
import path from 'path';
import { ensureVisitorFolder, uploadFile, downloadFile } from './googleDrive';
import {
  searchVisitorsByPhonePrefix,
  findVisitorByPhone,
  upsertVisitor,
  appendLog,
  listActiveLogs,
  listLogs,
  markExit,
  createPreRegistration,
  listExpectedLogs,
  checkInLog,
  deleteLogRows,
} from './googleSheetsVisitors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function timestampForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sanitizeForFilename(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

export function createVisitorRouter(requireRole: (roles: string[]) => express.RequestHandler) {
  const router = express.Router();
  const guard = requireRole(['Security', 'Master Admin']);

  router.get('/search', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const query = String(req.query.query || '').trim();
      const results = await searchVisitorsByPhonePrefix(query);
      res.json(results);
    } catch (err: any) {
      console.error('Visitor search failed:', err.message);
      res.status(500).json({ message: 'Failed to search visitors' });
    }
  });

  router.get('/lookup/:phone', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const visitor = await findVisitorByPhone(req.params.phone);
      res.json({ found: !!visitor, visitor });
    } catch (err: any) {
      console.error('Visitor lookup failed:', err.message);
      res.status(500).json({ message: 'Failed to look up visitor' });
    }
  });

  router.post(
    '/entry',
    guard,
    upload.fields([{ name: 'documentFile', maxCount: 1 }, { name: 'photoFile', maxCount: 1 }]),
    async (req: any, res: express.Response): Promise<any> => {
      try {
        const { phone, name, purpose, documentType, entryType, visitorIdCardNumber } = req.body;

        if (!phone || !name || !purpose || !visitorIdCardNumber) {
          return res.status(400).json({ message: 'Phone, name, purpose, and visitor ID card number are required' });
        }

        const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
        const photoFile = files?.photoFile?.[0];
        const documentFile = files?.documentFile?.[0];

        if (!photoFile) {
          return res.status(400).json({ message: 'A visitor photo is required' });
        }

        const isNewEntry = entryType !== 'Old';
        if (isNewEntry && (!documentFile || !documentType)) {
          return res.status(400).json({ message: 'Document type and document proof file are required for a new visitor' });
        }

        const existing = await findVisitorByPhone(phone);
        if (!isNewEntry && !existing) {
          return res.status(400).json({ message: 'No existing visitor record found for this phone number' });
        }

        const { documentFolderId, photoFolderId, folderDriveLink } = await ensureVisitorFolder(name, phone);

        let documentDriveLink = existing?.documentDriveLink || '';
        let effectiveDocumentType = documentType || existing?.documentType || '';

        if (documentFile) {
          const ext = path.extname(documentFile.originalname) || '';
          const docFilename = `${sanitizeForFilename(effectiveDocumentType || 'document')}_${sanitizeForFilename(phone)}${ext}`;
          const uploaded = await uploadFile(documentFolderId, docFilename, documentFile.mimetype, documentFile.buffer);
          documentDriveLink = uploaded.webViewLink;
        }

        const photoExt = path.extname(photoFile.originalname) || '.jpg';
        const photoFilename = `${sanitizeForFilename(name)}_${timestampForFilename(new Date())}${photoExt}`;
        const uploadedPhoto = await uploadFile(photoFolderId, photoFilename, photoFile.mimetype, photoFile.buffer);

        await upsertVisitor({
          phone,
          name,
          documentType: effectiveDocumentType,
          documentDriveLink,
          folderDriveLink,
          lastPhotoDriveLink: uploadedPhoto.webViewLink,
        });

        const log = await appendLog({
          phone,
          name,
          entryType: isNewEntry ? 'New' : 'Old',
          purpose,
          documentType: effectiveDocumentType,
          documentDriveLink,
          photoDriveLink: uploadedPhoto.webViewLink,
          visitorIdCardNumber,
          loggedBy: req.user?.email || req.user?.username || 'unknown',
        });

        res.status(201).json({ message: 'Visitor entry logged successfully', log });
      } catch (err: any) {
        console.error('Visitor entry failed:', err.message);
        res.status(500).json({ message: 'Failed to log visitor entry' });
      }
    }
  );

  // Streams a Drive file (photo/document) through our service account so the
  // browser never needs its own Google session or public sharing on the file.
  router.get('/file/:fileId', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { mimeType, buffer } = await downloadFile(req.params.fileId);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.send(buffer);
    } catch (err: any) {
      console.error('Failed to fetch Drive file:', err.message);
      res.status(404).json({ message: 'File not found or inaccessible' });
    }
  });

  router.get('/active', guard, async (_req: express.Request, res: express.Response): Promise<any> => {
    try {
      const logs = await listActiveLogs();
      res.json(logs);
    } catch (err: any) {
      console.error('Failed to list active visitors:', err.message);
      res.status(500).json({ message: 'Failed to list active visitors' });
    }
  });

  router.post('/exit', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { logId } = req.body;
      if (!logId) return res.status(400).json({ message: 'logId is required' });

      const updated = await markExit(logId);
      if (!updated) return res.status(404).json({ message: 'Log entry not found' });

      res.json({ message: 'Exit recorded', log: updated });
    } catch (err: any) {
      console.error('Failed to mark exit:', err.message);
      res.status(500).json({ message: 'Failed to record exit' });
    }
  });

  router.get('/logs', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { search, from, to } = req.query;
      const logs = await listLogs({
        search: search ? String(search) : undefined,
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
      });
      res.json(logs);
    } catch (err: any) {
      console.error('Failed to list visitor logs:', err.message);
      res.status(500).json({ message: 'Failed to list visitor logs' });
    }
  });

  // Admin pre-registers an expected guest ahead of arrival (name/phone is enough;
  // purpose/host/expectedTime are optional extra details).
  router.post('/preregister', guard, async (req: any, res: express.Response): Promise<any> => {
    try {
      const { name, phone, purpose, host, expectedTime } = req.body;

      if (!name && !phone) {
        return res.status(400).json({ message: 'Provide at least a guest name or phone number' });
      }

      const log = await createPreRegistration({
        name: name || '',
        phone: phone || '',
        purpose: purpose || 'Meeting',
        host: host || '',
        expectedTime: expectedTime || '',
        loggedBy: req.user?.email || req.user?.username || 'unknown',
      });

      res.status(201).json({ message: 'Guest pre-registered successfully', log });
    } catch (err: any) {
      console.error('Pre-registration failed:', err.message);
      res.status(500).json({ message: 'Failed to pre-register guest' });
    }
  });

  router.get('/expected', guard, async (_req: express.Request, res: express.Response): Promise<any> => {
    try {
      const logs = await listExpectedLogs();
      res.json(logs);
    } catch (err: any) {
      console.error('Failed to list expected visitors:', err.message);
      res.status(500).json({ message: 'Failed to list expected visitors' });
    }
  });

  // Security checks in a pre-registered guest on arrival — just a photo capture,
  // no re-collection of details already provided at pre-registration.
  router.post(
    '/checkin',
    guard,
    upload.fields([{ name: 'photoFile', maxCount: 1 }]),
    async (req: any, res: express.Response): Promise<any> => {
      try {
        const { logId } = req.body;
        if (!logId) return res.status(400).json({ message: 'logId is required' });

        const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
        const photoFile = files?.photoFile?.[0];
        if (!photoFile) return res.status(400).json({ message: 'A visitor photo is required to check in' });

        const expected = (await listExpectedLogs()).find((l) => l.logId === logId);
        if (!expected) return res.status(404).json({ message: 'Pre-registration not found or already checked in' });

        const { photoFolderId, folderDriveLink } = await ensureVisitorFolder(expected.name || expected.phone, expected.phone);
        const photoExt = path.extname(photoFile.originalname) || '.jpg';
        const photoFilename = `${sanitizeForFilename(expected.name || expected.phone)}_${timestampForFilename(new Date())}${photoExt}`;
        const uploadedPhoto = await uploadFile(photoFolderId, photoFilename, photoFile.mimetype, photoFile.buffer);

        const updated = await checkInLog(logId, uploadedPhoto.webViewLink);
        if (!updated) return res.status(404).json({ message: 'Pre-registration not found or already checked in' });

        if (expected.phone) {
          await upsertVisitor({
            phone: expected.phone,
            name: expected.name,
            folderDriveLink,
            lastPhotoDriveLink: uploadedPhoto.webViewLink,
          });
        }

        res.json({ message: 'Guest checked in successfully', log: updated });
      } catch (err: any) {
        console.error('Check-in failed:', err.message);
        res.status(500).json({ message: 'Failed to check in guest' });
      }
    }
  );

  router.delete('/delete', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { logId } = req.body;
      if (!logId) return res.status(400).json({ message: 'logId is required' });

      const count = await deleteLogRows([logId]);
      if (count === 0) return res.status(404).json({ message: 'Log entry not found' });

      res.json({ message: 'Log entry deleted', count });
    } catch (err: any) {
      console.error('Failed to delete log entry:', err.message);
      res.status(500).json({ message: 'Failed to delete log entry' });
    }
  });

  router.delete('/bulk-delete', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { logIds } = req.body;
      if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
        return res.status(400).json({ message: 'logIds array is required' });
      }

      const count = await deleteLogRows(logIds);
      res.json({ message: `${count} log entries deleted`, count });
    } catch (err: any) {
      console.error('Failed to bulk delete log entries:', err.message);
      res.status(500).json({ message: 'Failed to delete log entries' });
    }
  });

  return router;
}
