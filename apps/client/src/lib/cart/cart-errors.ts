import type { Cart } from '@e-pharmacy/types/cart';
import { isApiError } from '@e-pharmacy/api-client/transport';

//===================================================================

export class PartialCartMutationError extends Error {
  readonly code = 'PARTIAL_CART_MUTATION';
  readonly removedItems: number;
  readonly totalItems: number;
  readonly latestConfirmedCart: Cart;
  readonly refreshFailed: boolean;
  readonly refreshCause?: unknown;
  readonly requestId?: string;
  readonly requiresReload: boolean;

  constructor({
    removedItems,
    totalItems,
    latestConfirmedCart,
    cause,
    refreshCause,
  }: Readonly<{
    removedItems: number;
    totalItems: number;
    latestConfirmedCart: Cart;
    cause: unknown;
    refreshCause?: unknown;
  }>) {
    super('PARTIAL_CART_MUTATION', { cause });
    this.name = 'PartialCartMutationError';
    this.removedItems = removedItems;
    this.totalItems = totalItems;
    this.latestConfirmedCart = latestConfirmedCart;
    this.refreshFailed = refreshCause !== undefined;
    this.refreshCause = refreshCause;

    this.requestId = isApiError(refreshCause)
      ? refreshCause.requestId
      : isApiError(cause)
        ? cause.requestId
        : undefined;

    this.requiresReload = refreshCause !== undefined;
  }
}

//===================================================================

export function isPartialCartMutationError(
  error: unknown
): error is PartialCartMutationError {
  return error instanceof PartialCartMutationError;
}
