import {
  CART_PHARMACY_LIMIT_ERROR_CODE,
  MAX_PHARMACY_GROUPS_PER_CART,
} from '@e-pharmacy/config/cart';

import { ApiError } from '@e-pharmacy/api-client/transport';

//===================================================================

export const CART_ORDER_LIMIT_MODAL_TITLE = 'Cart order limit';

export const CART_ORDER_LIMIT_ERROR_MESSAGE = `Your cart can contain products from no more than ${MAX_PHARMACY_GROUPS_PER_CART} pharmacies. Confirm existing orders before adding products from another pharmacy.`;

//===================================================================

type ApiErrorPayloadWithCode = Readonly<{ code?: unknown }>;

//===================================================================

export function isCartOrderLimitError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (!error.payload || typeof error.payload !== 'object') return false;

  return (
    (error.payload as ApiErrorPayloadWithCode).code ===
    CART_PHARMACY_LIMIT_ERROR_CODE
  );
}
