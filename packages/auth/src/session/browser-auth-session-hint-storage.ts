import {
  clearBrowserAuthSessionHint,
  hasBrowserAuthSessionHint,
  setBrowserAuthSessionHint,
  type AuthSessionHintCookieOptions,
} from './auth-session-hint-cookie';

import type { AuthSessionHintStorage } from './session-hint-storage';

//===================================================================

export function createBrowserAuthSessionHintStorage(
  options: AuthSessionHintCookieOptions = {}
): AuthSessionHintStorage {
  return {
    hasHint: hasBrowserAuthSessionHint,
    setHint: () => setBrowserAuthSessionHint(options),
    clearHint: () => clearBrowserAuthSessionHint(options),
  };
}

//===================================================================

export const browserAuthSessionHintStorage =
  createBrowserAuthSessionHintStorage();
