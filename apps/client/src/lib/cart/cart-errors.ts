export class PartialCartMutationError extends Error {
  readonly code = 'PARTIAL_CART_MUTATION';
  readonly removedItems: number;
  readonly totalItems: number;

  constructor({
    removedItems,
    totalItems,
    cause,
  }: Readonly<{
    removedItems: number;
    totalItems: number;
    cause: unknown;
  }>) {
    super(
      `Removed ${removedItems} of ${totalItems} cart items before the operation failed.`,
      { cause }
    );
    this.name = 'PartialCartMutationError';
    this.removedItems = removedItems;
    this.totalItems = totalItems;
  }
}

//===================================================================

export function isPartialCartMutationError(
  error: unknown
): error is PartialCartMutationError {
  return error instanceof PartialCartMutationError;
}
