export function readMockStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeMockStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A persistência é uma conveniência do demo; o mock continua funcional em modo privado.
  }
}

export function removeMockStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage pode estar indisponível no browser; o estado em memória ainda pode ser resetado.
  }
}
