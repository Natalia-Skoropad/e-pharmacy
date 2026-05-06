const AUTH_TOKEN_STORAGE_KEY = 'e-pharmacy-client-auth-token';

//===================================================================

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

//===================================================================

export function getAuthToken(): string | null {
  if (!canUseBrowserStorage()) return null;

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

//===================================================================

export function setAuthToken(token: string): void {
  if (!canUseBrowserStorage()) return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

//===================================================================

export function removeAuthToken(): void {
  if (!canUseBrowserStorage()) return;

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
