/**
 * Number of days a cart item remains in the cart before backend cleanup removes it.
 * Cart items represent expiring purchase intent; stock is reserved only after checkout creates an order.
 */
export const CART_ITEM_TTL_DAYS = 3;
