import { ApiError } from '@e-pharmacy/api-client/core';

//===================================================================

export const CART_ORDER_LIMIT_MODAL_TITLE = 'Cart order limit';

export const CART_ORDER_LIMIT_ERROR_MESSAGE =
  'You cannot add more than 15 orders to your cart. Please confirm the previous ones to continue shopping';

//===================================================================

export function isCartOrderLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.message.includes('15 orders');
}
