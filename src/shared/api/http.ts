import axios from 'axios';
import { getMockSessionHandle } from '@/shared/session/mock-session';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const sessionHandle = getMockSessionHandle();
    if (sessionHandle) config.headers.set('X-Mock-Session', sessionHandle);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);
