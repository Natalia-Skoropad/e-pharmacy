import type { AuthSessionHintStorage } from './session-hint-storage';

//===================================================================

export const noopAuthSessionHintStorage: AuthSessionHintStorage = {
  hasHint: () => false,
  setHint: () => undefined,
  clearHint: () => undefined,
};
