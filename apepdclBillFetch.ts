import { chromium, Browser, Page } from 'playwright';

const BILL_URL = 'https://www.apeasternpower.com/viewBillDetailsMain';
const SESSION_TTL_MS = 3 * 60 * 1000;

interface Session {
  browser: Browser;
  page: Page;
  createdAt: number;
}

const sessions = new Map<string, Session>();

function sweepExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      session.browser.close().catch(() => {});
      sessions.delete(id);
    }
  }
}

setInterval(sweepExpiredSessions, 60 * 1000).unref();

async function screenshotCaptcha(page: Page): Promise<string> {
  const buffer = await page.locator('canvas:visible').first().screenshot();
  return `data:image/png;base64,${buffer.toString('base64')}`;
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

// Passed to page.evaluate() as a plain string rather than a closure reference:
// tsx/esbuild transpiles this file with a __name helper for stack-trace name
// preservation, and Playwright serializes closures via toString() — which would
// carry a dangling __name(...) call into the page context and throw
// ReferenceError there. A string literal is evaluated as-is, sidestepping that.
const PARSE_BILL_TABLE_SCRIPT = `
(function () {
  const labelToValue = {};
  // Label cells may contain a leading checkbox (e.g. Present Bill Amount) —
  // only read its own text, never an input's .value (a checkbox's value is
  // the meaningless default "on").
  const labelText = (td) => (td.textContent || '').trim().replace(/\\s+/g, ' ');
  // Some value cells (e.g. Present Bill Amount) render as an editable text
  // <input> rather than plain text, so textContent alone reads empty there.
  const valueText = (td) => {
    const input = td.querySelector('input[type="text"], input:not([type]), textarea');
    if (input) return (input.value || input.getAttribute('value') || '').trim();
    return (td.textContent || '').trim().replace(/\\s+/g, ' ');
  };
  const rows = Array.from(document.querySelectorAll('table tr'));
  for (const row of rows) {
    const tds = Array.from(row.querySelectorAll('td'));
    for (let i = 0; i < tds.length - 1; i += 2) {
      const label = labelText(tds[i]);
      const value = valueText(tds[i + 1]);
      if (label) labelToValue[label] = value;
    }
  }
  const find = (needle) => {
    const key = Object.keys(labelToValue).find((k) => k.toLowerCase().includes(needle.toLowerCase()));
    return key ? labelToValue[key] : '';
  };
  return {
    serviceNumber: find('Service Number'),
    consumerName: find('Consumer Name'),
    category: find('Category'),
    address: find('Address'),
    sectionOffice: find('Section Office'),
    ero: find('ERO'),
    billDate: find('Bill Date'),
    dueDate: find('Due Date'),
    dateOfDisconnection: find('Date of Disconnection'),
    presentBillAmount: find('Present Bill Amount'),
    totalAmountToPay: find('Total Amount'),
  };
})()
`;

async function parseBillTable(page: Page): Promise<ApepdclBillData> {
  return page.evaluate(PARSE_BILL_TABLE_SCRIPT);
}

export async function startApepdclLookup(serviceNumber: string): Promise<{ sessionId: string; captchaImage: string }> {
  sweepExpiredSessions();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BILL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByPlaceholder('Enter Service Number / UKSCNO').fill(serviceNumber);

  const captchaImage = await screenshotCaptcha(page);
  const sessionId = `apepdcl-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  sessions.set(sessionId, { browser, page, createdAt: Date.now() });

  return { sessionId, captchaImage };
}

export async function refreshApepdclCaptcha(sessionId: string): Promise<{ captchaImage: string } | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const refreshBtn = session.page.locator('canvas:visible').first().locator('xpath=following-sibling::button[1]');
  if (await refreshBtn.count()) {
    await refreshBtn.click();
    await session.page.waitForTimeout(500);
  }
  const captchaImage = await screenshotCaptcha(session.page);
  return { captchaImage };
}

export type ApepdclVerifyResult =
  | { status: 'success'; bill: ApepdclBillData }
  | { status: 'invalid_captcha'; captchaImage: string }
  | { status: 'otp_required' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export async function submitApepdclCaptcha(sessionId: string, captchaText: string): Promise<ApepdclVerifyResult> {
  const session = sessions.get(sessionId);
  if (!session) return { status: 'error', message: 'Session expired, please start again' };

  const { page } = session;
  try {
    const captchaInput = page.getByPlaceholder('Enter the code shown above');
    await captchaInput.fill('');
    await captchaInput.fill(captchaText);

    const findBtn = page.locator('button:visible').filter({ hasText: /find my bill/i }).first();
    await findBtn.click();
    await page.waitForTimeout(2500);

    const bodyText = (await page.textContent('body')) || '';

    if (bodyText.includes('Consumer Name')) {
      const bill = await parseBillTable(page);
      await session.browser.close().catch(() => {});
      sessions.delete(sessionId);
      return { status: 'success', bill };
    }

    if (bodyText.toLowerCase().includes('otp')) {
      await session.browser.close().catch(() => {});
      sessions.delete(sessionId);
      return { status: 'otp_required' };
    }

    if (bodyText.toLowerCase().includes('no record') || bodyText.toLowerCase().includes('not found')) {
      await session.browser.close().catch(() => {});
      sessions.delete(sessionId);
      return { status: 'not_found' };
    }

    // Assume invalid captcha; refresh it for another human attempt.
    const captchaImage = await screenshotCaptcha(page);
    return { status: 'invalid_captcha', captchaImage };
  } catch (err: any) {
    await session.browser.close().catch(() => {});
    sessions.delete(sessionId);
    return { status: 'error', message: err.message || 'Failed to fetch bill' };
  }
}

export async function cancelApepdclSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;
  await session.browser.close().catch(() => {});
  sessions.delete(sessionId);
}
