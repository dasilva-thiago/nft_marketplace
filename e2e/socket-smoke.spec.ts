import { expect, test } from '@playwright/test';

test('Socket.IO client recebe confirmação do handler MSW pelo binding', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Marketplace de NFTs' }).waitFor();
  await page.waitForTimeout(300);
  const userId = `test-user-${Date.now()}`;
  const result = await page.evaluate(async (activeUserId) => {
    const { createMarketplaceSocket } = await import('/src/realtime/socket-client.ts');
    const socket = createMarketplaceSocket(activeUserId);
    return await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout esperando session.ready via Socket.IO/MSW'));
      }, 5000);
      socket.on('session.ready', ({ userId: acknowledgedUserId }) => {
        window.clearTimeout(timeout);
        socket.disconnect();
        resolve(acknowledgedUserId);
      });
      socket.connect();
    });
  }, userId);
  expect(result).toBe(userId);
});
