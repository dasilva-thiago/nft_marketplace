const mockDelayMs = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? '0');

export const appEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  mockDelayMs: Number.isFinite(mockDelayMs) && mockDelayMs >= 0 ? mockDelayMs : 0,
} as const;
