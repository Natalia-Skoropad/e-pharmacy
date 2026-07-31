import { formatStockLabel } from '@e-pharmacy/utils/numbers';

//===================================================================

export type StockAvailabilityProps = Readonly<{
  stockQuantity?: number | null;
  className?: string;
}>;

export type StockAvailabilityState =
  | Readonly<{ status: 'known'; quantity: number }>
  | Readonly<{ status: 'unknown' }>;

//===================================================================

export function getStockAvailabilityState(
  stockQuantity: number | null | undefined
): StockAvailabilityState {
  if (stockQuantity === null || stockQuantity === undefined) {
    return { status: 'unknown' };
  }

  if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
    throw new RangeError(
      'Stock quantity must be a safe non-negative integer when provided.'
    );
  }

  return { status: 'known', quantity: stockQuantity };
}

//===================================================================

function StockAvailability({
  stockQuantity,
  className,
}: StockAvailabilityProps) {
  const state = getStockAvailabilityState(stockQuantity);

  return (
    <p className={className}>
      {state.status === 'known'
        ? (formatStockLabel(state.quantity) ?? '—')
        : 'Availability is not confirmed.'}
    </p>
  );
}

export default StockAvailability;
