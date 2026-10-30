import { expect, test } from '@playwright/test';

async function openDemo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
}

test('rate limit simulado devolve 429 e Retry-After; reset restaura o catálogo', async ({ page }) => {
  await openDemo(page);
  const result = await page.evaluate(async () => {
    await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'rate-limited' }),
    });
    const limitedResponse = await fetch('/api/nfts?page=1&pageSize=3');
    const limitedBody = await limitedResponse.json() as { code: string };
    const retryAfter = limitedResponse.headers.get('Retry-After');

    await fetch('/api/__mock/reset', { method: 'POST' });
    const resetResponse = await fetch('/api/nfts?page=1&pageSize=3');
    const resetBody = await resetResponse.json() as { items: unknown[]; totalItems: number };
    return { status: limitedResponse.status, code: limitedBody.code, retryAfter, resetStatus: resetResponse.status, resetBody };
  });

  expect(result.status).toBe(429);
  expect(result.code).toBe('RATE_LIMITED');
  expect(result.retryAfter).toBe('2');
  expect(result.resetStatus).toBe(200);
  expect(result.resetBody.items).toHaveLength(3);
  expect(result.resetBody.totalItems).toBe(12);
});
