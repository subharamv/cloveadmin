import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { createApiApp } from './apiApp';
import { createApepdclRouter } from './billRoutesApepdcl';

const PORT = 3000;

async function run() {
  const { app, requireRole } = createApiApp();

  // APEPDCL live-lookup routes use Playwright (a full headless Chromium) —
  // local dev only, never part of the Netlify Function's bundle. Opt-in via
  // ENABLE_APEPDCL_SCRAPER since it also requires `npx playwright install`.
  if (process.env.ENABLE_APEPDCL_SCRAPER === 'true') {
    app.use('/api/bills', createApepdclRouter(requireRole));
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

run();
