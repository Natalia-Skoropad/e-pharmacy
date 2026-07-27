/**
 * Read-only auth bootstrap hint contract.
 *
 * Cookie writes are intentionally absent: the Next.js BFF is the sole owner
 * of the auth-ready hint lifetime and attributes.
 */
export type AuthSessionHintStorage = {
  hasHint: () => boolean;
};
