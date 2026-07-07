import serverless from 'serverless-http';
import { createApiApp } from '../../apiApp';

// Module-scope, not per-invocation: a warm Lambda container reuses this
// across requests, so seeding/setup only re-runs on a cold start, not every
// call. The Netlify-deployed API never registers the APEPDCL/Playwright
// routes — those live in billRoutesApepdcl.ts, imported only by server.ts
// (local dev), so they're outside this function's dependency graph entirely.
const { app } = createApiApp();

// Without this, serverless-http treats every response body as UTF-8 text
// before handing it to Lambda/Netlify. Visitor photos and documents streamed
// from Drive (image/*, application/pdf) then get lossily re-encoded — any
// byte that isn't valid UTF-8 turns into a U+FFFD replacement byte — which
// corrupts the file. Declaring these content types as binary makes
// serverless-http base64-encode the body instead, preserving it exactly.
export const handler = serverless(app, { binary: ['image/*', 'application/pdf', 'application/octet-stream'] });
