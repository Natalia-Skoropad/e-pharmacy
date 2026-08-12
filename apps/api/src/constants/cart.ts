export const CART_ITEM_MAX_QUANTITY = 99;
export const CART_ITEM_TTL_DAYS = 3;

// A multi-pharmacy cart creates one order per pharmacy. Limiting the number of
// pharmacy groups prevents one checkout session from producing an excessive
// number of independent orders.
export const MAX_PHARMACY_GROUPS_PER_CART = 15;

export const CART_PHARMACY_LIMIT_ERROR_CODE =
  'CART_PHARMACY_LIMIT_EXCEEDED';
