import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/query/query-client';

type AppProvidersProps = { children: ReactNode };

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    const resetMockCache = () => queryClient.clear();
    window.addEventListener('kurio:mock-reset', resetMockCache);
    return () => window.removeEventListener('kurio:mock-reset', resetMockCache);
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
