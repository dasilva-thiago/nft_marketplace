import { http, HttpResponse } from 'msw';
import { socketIoMockHandler } from './socket-io-handler';

// Handlers de domínio devem ser a única origem de dados simulados. Expandir junto dos contratos.
export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ ok: true, scenario: 'default' })),
  socketIoMockHandler,
];
