import {
  clearBrowserAuthSessionHint,
  hasBrowserAuthSessionHint,
  setBrowserAuthSessionHint,
} from './auth-session-hint-cookie';

import type { AuthSessionHintStorage } from './session-hint-storage';

//===================================================================

export const browserAuthSessionHintStorage: AuthSessionHintStorage = {
  hasHint: hasBrowserAuthSessionHint,
  setHint: setBrowserAuthSessionHint,
  clearHint: clearBrowserAuthSessionHint,
};
