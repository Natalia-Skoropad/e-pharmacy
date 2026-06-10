import {
  getClientAuthSessionHint,
  removeClientAuthSessionHint,
  setClientAuthSessionHint,
} from './auth-token-storage';

import type { AuthSessionHintStorage } from './session-hint-storage';

//===================================================================

export const browserAuthSessionHintStorage: AuthSessionHintStorage = {
  hasHint: () => getClientAuthSessionHint(),
  setHint: () => {
    setClientAuthSessionHint();
  },
  clearHint: () => {
    removeClientAuthSessionHint();
  },
};
