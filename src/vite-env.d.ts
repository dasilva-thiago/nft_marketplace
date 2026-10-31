/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_MOCK_SCENARIO?:
    | 'default'
    | 'empty'
    | 'slow'
    | 'out-of-order'
    | 'rate-limited'
    | 'unavailable'
    | 'session-expired';
  readonly VITE_MOCK_DELAY_MS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
