// A multi-pharmacy cart creates one order per pharmacy. Limiting the number of
// pharmacy groups prevents one checkout session from producing an excessive
// number of independent orders.
export const MAX_PHARMACY_GROUPS_PER_CART = 15;
