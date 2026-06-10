export type AuthSessionHintStorage = {
  hasHint: () => boolean;
  setHint: () => void;
  clearHint: () => void;
};
