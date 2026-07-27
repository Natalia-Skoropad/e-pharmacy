import { hasBrowserAuthSessionHint } from './auth-session-hint-cookie';
import type { AuthSessionHintStorage } from './session-hint-storage';

//===================================================================

/**
 * Reads the client-visible auth-ready cookie written and cleared by the
 * Next.js BFF. Browser code never rewrites server-owned cookie attributes.
 */
export const serverManagedBrowserAuthSessionHintStorage: AuthSessionHintStorage =
  {
    hasHint: hasBrowserAuthSessionHint,
  };
