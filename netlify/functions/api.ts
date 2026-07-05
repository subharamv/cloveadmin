import serverless from 'serverless-http';
import { createApiApp } from '../../apiApp';

// Module-scope, not per-invocation: a warm Lambda container reuses this
// across requests, so seeding/setup only re-runs on a cold start, not every
// call. The Netlify-deployed API never registers the APEPDCL/Playwright
// routes — those live in billRoutesApepdcl.ts, imported only by server.ts
// (local dev), so they're outside this function's dependency graph entirely.
const { app } = createApiApp();

export const handler = serverless(app);
