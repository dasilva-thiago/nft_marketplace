import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Os recursos e códigos de erro serão tipados em shared/api/contracts.ts.
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);
