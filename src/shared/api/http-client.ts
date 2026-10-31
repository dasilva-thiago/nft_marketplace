import axios from 'axios';
import { appEnv } from '@/app/config/env';
import { getSessionCredential } from '@/shared/storage/session-credential';

export const http = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  if (appEnv.enableMocks) {
    const sessionCredential = getSessionCredential();
    if (sessionCredential) config.headers.set('X-Mock-Session', sessionCredential);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);
