import express from 'express';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { ensureVisitorFolder, uploadFile, downloadFile, deleteFile, extractFileIdFromDriveLink } from './googleDrive';
import {
  searchVisitorsByPhonePrefix,
  findVisitorByPhone,
  upsertVisitor,
  appendLog,
  listActiveLogs,
  listLogs,
  markExit,
  createPreRegistration,
  updatePreRegistration,
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

  // Security/Admin correction of a returning visitor's profile details
  // (name, occupation, document type) — independent of logging a new visit.
  router.put('/profile', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { phone, name, occupation, documentType } = req.body;
      if (!phone || !name) {
        return res.status(400).json({ message: 'Phone and name are required' });
      }

      const existing = await findVisitorByPhone(phone);
      if (!existing) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      await upsertVisitor({
        phone,
        name,
        occupation: occupation ?? existing.occupation,
        documentType: documentType ?? existing.documentType,
      });

      const updated = await findVisitorByPhone(phone);
      res.json({ message: 'Visitor profile updated successfully', visitor: updated });
    } catch (err: any) {
      console.error('Failed to update visitor profile:', err.message);
      res.status(500).json({ message: 'Failed to update visitor profile' });
    }
  });

  router.post(
    '/entry',
    guard,
    upload.fields([{ name: 'documentFile', maxCount: 1 }, { name: 'photoFile', maxCount: 1 }]),
    async (req: any, res: express.Response): Promise<any> => {
      try {
        const { phone, name, purpose, documentType, entryType, visitorIdCardNumber, occupation, numberOfPersons } = req.body;

        if (!phone || !name || !purpose || !visitorIdCardNumber) {
          return res.status(400).json({ message: 'Phone, name, purpose, and visitor ID card number are required' });
        }

        const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
        const photoFile = files?.photoFile?.[0];
        const documentFile = files?.documentFile?.[0];

        const isNewEntry = entryType !== 'Old';
        if (isNewEntry && (!documentFile || !documentType)) {
          return res.status(400).json({ message: 'Document type and document proof file are required for a new visitor' });
        }

        const existing = await findVisitorByPhone(phone);
        if (!isNewEntry && !existing) {
          return res.status(400).json({ message: 'No existing visitor record found for this phone number' });
        }

        // Returning visitors reuse their photo on file by default (saves a
        // re-capture + Drive upload every visit) — security can still attach
        // a fresh one via the form if it needs updating. New visitors always
        // need a photo since there's nothing on file yet.
        if (!photoFile && (isNewEntry || !existing?.lastPhotoDriveLink)) {
          return res.status(400).json({ message: 'A visitor photo is required' });
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

        let photoDriveLink = existing?.lastPhotoDriveLink || '';
        if (photoFile) {
          const photoExt = path.extname(photoFile.originalname) || '.jpg';
          const photoFilename = `${sanitizeForFilename(name)}_${timestampForFilename(new Date())}${photoExt}`;
          const uploadedPhoto = await uploadFile(photoFolderId, photoFilename, photoFile.mimetype, photoFile.buffer);

          // Replacing a returning visitor's photo on file — remove the old
          // Drive file instead of leaving it orphaned, since the whole point
          // of reusing photos is to save storage.
          if (!isNewEntry && existing?.lastPhotoDriveLink) {
            const oldFileId = extractFileIdFromDriveLink(existing.lastPhotoDriveLink);
            if (oldFileId) {
              deleteFile(oldFileId).catch((err: any) => {
                console.error('Failed to delete replaced visitor photo:', err.message);
              });
            }
          }

          photoDriveLink = uploadedPhoto.webViewLink;
        }

        const effectiveOccupation = occupation || existing?.occupation || '';
        const parsedPersons = Number(numberOfPersons);
        const effectiveNumberOfPersons = Number.isFinite(parsedPersons) && parsedPersons > 0 ? Math.floor(parsedPersons) : 1;

        await upsertVisitor({
          phone,
          name,
          documentType: effectiveDocumentType,
          documentDriveLink,
          folderDriveLink,
          lastPhotoDriveLink: photoDriveLink,
          occupation: effectiveOccupation,
        });

        const log = await appendLog({
          phone,
          name,
          entryType: isNewEntry ? 'New' : 'Old',
          purpose,
          documentType: effectiveDocumentType,
          documentDriveLink,
          photoDriveLink,
          visitorIdCardNumber,
          loggedBy: req.user?.email || req.user?.username || 'unknown',
          occupation: effectiveOccupation,
          numberOfPersons: effectiveNumberOfPersons,
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

  // Generates a self-service pre-registration link/QR that admins can hand to
  // an expected guest — the guest fills in their own details, no security
  // login required on their end. The token is a stateless signed JWT (no
  // server-side storage needed) that expires after 24h.
  router.post('/preregister-link', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
      const token = jwt.sign({ purpose: 'guest-preregister' }, jwtSecret, { expiresIn: '24h' });
      const appUrl = process.env.APP_URL || process.env.URL || `http://localhost:${process.env.PORT || 3000}`;
      const link = `${appUrl}/guest-preregister?token=${encodeURIComponent(token)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      res.json({ link, expiresAt });
    } catch (err: any) {
      console.error('Failed to generate pre-registration link:', err.message);
      res.status(500).json({ message: 'Failed to generate pre-registration link' });
    }
  });

  // Public endpoint the guest's own browser hits from the shared link/QR —
  // intentionally NOT behind `guard`, since the guest has no security/admin
  // account. Trust is established solely by the signed, time-limited token.
  // Collects the same required details as the security-desk entry form
  // (document proof + photo included) so there's nothing left to fill in
  // once the guest actually arrives at the gate.
  router.post(
    '/guest-preregister',
    upload.fields([{ name: 'documentFile', maxCount: 1 }, { name: 'photoFile', maxCount: 1 }]),
    async (req: any, res: express.Response): Promise<any> => {
      try {
        const { token, name, phone, purpose, occupation, documentType, numberOfPersons } = req.body;
        if (!token) {
          return res.status(400).json({ message: 'Missing registration token' });
        }
        if (!name || !phone || !purpose || !occupation || !documentType) {
          return res.status(400).json({ message: 'Name, phone, purpose, occupation, and document type are required' });
        }

        const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
        const documentFile = files?.documentFile?.[0];
        const photoFile = files?.photoFile?.[0];
        if (!documentFile || !photoFile) {
          return res.status(400).json({ message: 'Document proof and a photo are required' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
        try {
          const decoded = jwt.verify(token, jwtSecret) as { purpose?: string };
          if (decoded.purpose !== 'guest-preregister') throw new Error('wrong token purpose');
        } catch {
          return res.status(401).json({ message: 'This registration link has expired or is invalid. Please ask reception for a new one.' });
        }

        const { documentFolderId, photoFolderId, folderDriveLink } = await ensureVisitorFolder(name, phone);

        const docExt = path.extname(documentFile.originalname) || '';
        const docFilename = `${sanitizeForFilename(documentType)}_${sanitizeForFilename(phone)}${docExt}`;
        const uploadedDoc = await uploadFile(documentFolderId, docFilename, documentFile.mimetype, documentFile.buffer);

        const photoExt = path.extname(photoFile.originalname) || '.jpg';
        const photoFilename = `${sanitizeForFilename(name)}_${timestampForFilename(new Date())}${photoExt}`;
        const uploadedPhoto = await uploadFile(photoFolderId, photoFilename, photoFile.mimetype, photoFile.buffer);

        const parsedPersons = Number(numberOfPersons);
        const effectiveNumberOfPersons = Number.isFinite(parsedPersons) && parsedPersons > 0 ? Math.floor(parsedPersons) : 1;

        await upsertVisitor({
          phone,
          name,
          documentType,
          documentDriveLink: uploadedDoc.webViewLink,
          folderDriveLink,
          lastPhotoDriveLink: uploadedPhoto.webViewLink,
          occupation,
        });

        const log = await createPreRegistration({
          name,
          phone,
          purpose,
          host: '',
          expectedTime: '',
          loggedBy: 'guest-self-registration',
          occupation,
          documentType,
          documentDriveLink: uploadedDoc.webViewLink,
          photoDriveLink: uploadedPhoto.webViewLink,
          numberOfPersons: effectiveNumberOfPersons,
        });

        res.status(201).json({ message: 'You are pre-registered. Show this confirmation at the gate.', log });
      } catch (err: any) {
        console.error('Guest self pre-registration failed:', err.message);
        res.status(500).json({ message: 'Failed to submit your pre-registration' });
      }
    }
  );

  // Admin edits a pre-registered guest's details before arrival (only while
  // still 'Expected' — once checked in, the log stands as recorded).
  router.put('/preregister/:logId', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { logId } = req.params;
      const { name, phone, purpose, host, expectedTime } = req.body;

      const updated = await updatePreRegistration(logId, { name, phone, purpose, host, expectedTime });
      if (!updated) return res.status(404).json({ message: 'Pre-registration not found or already checked in' });

      res.json({ message: 'Guest details updated successfully', log: updated });
    } catch (err: any) {
      console.error('Failed to update pre-registration:', err.message);
      res.status(500).json({ message: 'Failed to update guest details' });
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
