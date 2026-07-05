import express from 'express';
import { startApepdclLookup, submitApepdclCaptcha, refreshApepdclCaptcha, cancelApepdclSession } from './apepdclBillFetch';

// Local-dev-only: these routes depend on Playwright (a full headless
// Chromium), which cannot run in a serverless/Netlify Function. This module
// is only imported by server.ts, never by the Netlify function entry point,
// so 'playwright' never ends up in that deployment's bundle.
//
// A human in the admin/security session reads the CAPTCHA image served below
// and types it in, exactly as they would on the APEPDCL site directly — we
// only automate the surrounding navigation and parsing, never the CAPTCHA
// verification step itself.
export function createApepdclRouter(requireRole: (roles: string[]) => express.RequestHandler) {
  const router = express.Router();
  const guard = requireRole(['Security', 'Master Admin', 'Admin']);

  router.post('/apepdcl/start', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { serviceNumber } = req.body;
      if (!serviceNumber) return res.status(400).json({ message: 'Service number is required' });

      const { sessionId, captchaImage } = await startApepdclLookup(String(serviceNumber));
      res.json({ sessionId, captchaImage });
    } catch (err: any) {
      console.error('Failed to start APEPDCL lookup:', err.message);
      res.status(502).json({ message: 'Could not reach APEPDCL right now. Please try again later.' });
    }
  });

  router.post('/apepdcl/refresh-captcha', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

      const result = await refreshApepdclCaptcha(sessionId);
      if (!result) return res.status(404).json({ message: 'Session expired, please start again' });
      res.json(result);
    } catch (err: any) {
      console.error('Failed to refresh APEPDCL captcha:', err.message);
      res.status(500).json({ message: 'Failed to refresh captcha' });
    }
  });

  router.post('/apepdcl/verify', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { sessionId, captchaText } = req.body;
      if (!sessionId || !captchaText) return res.status(400).json({ message: 'sessionId and captchaText are required' });

      const result = await submitApepdclCaptcha(sessionId, String(captchaText));
      res.json(result);
    } catch (err: any) {
      console.error('Failed to verify APEPDCL captcha:', err.message);
      res.status(500).json({ message: 'Failed to verify captcha' });
    }
  });

  router.post('/apepdcl/cancel', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { sessionId } = req.body;
      if (sessionId) await cancelApepdclSession(sessionId);
      res.json({ message: 'Session cancelled' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to cancel session' });
    }
  });

  return router;
}
