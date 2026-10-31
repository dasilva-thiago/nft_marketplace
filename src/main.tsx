import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers/app-providers';
import { appEnv } from '@/app/config/env';
import { router } from '@/app/router';
import { setMockWorkerReady } from '@/shared/api/http-client';
import '@/styles/index.css';

declare global {
  interface Window {
    __KURIO_MSW_READY__?: Promise<void>;
  }
}

const mockWorkerReady = appEnv.enableMocks
  ? new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        void import('@/mocks/browser')
          .then(({ enableMocks }) => enableMocks())
          .then(resolve, reject);
      }, 0);
    })
  : Promise.resolve();

setMockWorkerReady(mockWorkerReady);
if (appEnv.enableMocks) window.__KURIO_MSW_READY__ = mockWorkerReady;
void mockWorkerReady.catch((error: unknown) => {
  console.error('Não foi possível iniciar o worker de demonstração.', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
