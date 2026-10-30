import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const worker = setupWorker(...handlers);
export async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return;
  await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } });
}
