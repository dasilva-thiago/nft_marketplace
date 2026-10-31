import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers/app-providers';
import { appEnv } from '@/app/config/env';
import { router } from '@/app/router';
import '@/styles/index.css';

async function bootstrap() {
  if (appEnv.enableMocks) {
    const { enableMocks } = await import('@/mocks/browser');
    await enableMocks();
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>,
  );
}

void bootstrap();
