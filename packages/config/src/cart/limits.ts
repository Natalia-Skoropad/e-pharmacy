/**
 * A multi-pharmacy cart creates one order per pharmacy. Keep this value aligned
 * with the backend-local cart constant through contract parity checks.
 */
export const MAX_PHARMACY_GROUPS_PER_CART = 15;

/** Stable business error code returned when a new pharmacy group exceeds the limit. */
export const CART_PHARMACY_LIMIT_ERROR_CODE =
  'CART_PHARMACY_LIMIT_EXCEEDED';
