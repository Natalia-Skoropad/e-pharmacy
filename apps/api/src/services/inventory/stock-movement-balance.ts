import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { httpError } from '../../utils/http/httpError';

//===============================================================

export function isValidStockBalance(input: {
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}): boolean {
  const { stockQuantity, reservedQuantity, availableQuantity } = input;

  return (
    Number.isInteger(stockQuantity) &&
    Number.isInteger(reservedQuantity) &&
    Number.isInteger(availableQuantity) &&
    stockQuantity >= 0 &&
    reservedQuantity >= 0 &&
    availableQuantity >= 0 &&
    reservedQuantity <= stockQuantity &&
    availableQuantity === stockQuantity - reservedQuantity
  );
}

//===============================================================

export function assertStockBalance(input: {
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}): void {
  if (!isValidStockBalance(input)) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock balance is inconsistent. Physical stock must equal reserved plus available stock.'
    );
  }
}

//===============================================================

export function getMovementValueQuantity(input: {
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
}): number {
  return Math.max(
    Math.abs(input.stockDelta),
    Math.abs(input.reservedDelta),
    Math.abs(input.availableDelta)
  );
}
