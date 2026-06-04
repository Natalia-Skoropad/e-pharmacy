import { ApiError } from '@e-pharmacy/api-client/core';

//===================================================================

export const CART_INVOICE_LIMIT_MODAL_TITLE = 'Cart invoice limit';

export const CART_INVOICE_LIMIT_ERROR_MESSAGE =
  'You cannot add more than 15 invoices to your cart. Please confirm the previous ones to continue shopping';

//===================================================================

export function isCartInvoiceLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.message.includes('15 invoices');
}
