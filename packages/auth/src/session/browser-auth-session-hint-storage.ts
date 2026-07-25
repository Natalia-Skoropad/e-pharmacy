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

//===================================================================

/**
 * Use when the Next.js BFF is the sole owner of the browser auth-hint cookie.
 * The browser reads the hint but never rewrites cookie attributes that are
 * controlled by server-only environment variables.
 */
export const serverManagedBrowserAuthSessionHintStorage: AuthSessionHintStorage =
  {
    hasHint: hasBrowserAuthSessionHint,
    setHint: () => undefined,
    clearHint: () => undefined,
  };
