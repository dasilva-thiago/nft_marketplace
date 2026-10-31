import { test as base, expect, type Page } from '@playwright/test';

const appOrigin = 'http://127.0.0.1:5173';

async function waitForMockWorker(page: Page) {
  await page.waitForFunction(
    async () => {
      try {
        const ready = (window as Window & { __KURIO_MSW_READY__?: Promise<void> })
          .__KURIO_MSW_READY__;
        if (!ready) return false;
        await ready;
        if (!navigator.serviceWorker.controller) return false;
        const response = await fetch('/api/health');
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
          return false;
        return (await response.json()).ok === true;
      } catch {
        return false;
      }
    },
    null,
    { timeout: 10_000, polling: 50 },
  );
}

async function waitForMockReset(page: Page) {
  await waitForMockWorker(page);
  await page.waitForFunction(
    async () => {
      if (!navigator.serviceWorker.controller) return false;
      try {
        const response = await fetch('/api/__mock/reset', { method: 'POST' });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
          return false;
        const payload = await response.json();
        return payload.scenario === 'default' && payload.reset === true;
      } catch {
        return false;
      }
    },
    null,
    { timeout: 10_000, polling: 50 },
  );
}

function isAppUrl(url: string | URL) {
  try {
    return new URL(url.toString(), appOrigin).origin === appOrigin;
  } catch {
    return false;
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    let initializedMock = false;
    const originalGoto = page.goto.bind(page);
    Object.defineProperty(page, 'goto', {
      configurable: true,
      value: async (...args: Parameters<Page['goto']>) => {
        const response = await originalGoto(...args);
        if (isAppUrl(args[0])) {
          if (!initializedMock) {
            await waitForMockReset(page);
            initializedMock = true;
          } else {
            await waitForMockWorker(page);
          }
        }
        return response;
      },
    });

    const originalReload = page.reload.bind(page);
    Object.defineProperty(page, 'reload', {
      configurable: true,
      value: async (...args: Parameters<Page['reload']>) => {
        const response = await originalReload(...args);
        if (isAppUrl(page.url())) await waitForMockWorker(page);
        return response;
      },
    });

    await use(page);
  },
});

export { expect, type Page };
