const SESSION_STORAGE_KEY = 'kurio.mock.session';

export function getSessionCredential(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionCredential(credential: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, credential);
}

export function clearSessionCredential(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
