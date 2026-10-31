const MOCK_SESSION_STORAGE_KEY = 'kurio.mock.session';

export function getMockSessionHandle(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY);
}

export function setMockSessionHandle(sessionId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, sessionId);
}

export function clearMockSessionHandle(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
}
