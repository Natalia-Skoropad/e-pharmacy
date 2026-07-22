import { formatStockLabel } from '@e-pharmacy/utils/numbers';

//===================================================================

type StockAvailabilityProps = {
  stockQuantity?: number | null;
  className?: string;
};

//===================================================================

function normalizeStockQuantity(stockQuantity: number | null | undefined) {
  return Number.isFinite(stockQuantity) ? Math.max(0, Number(stockQuantity)) : 0;
}

//===================================================================

function StockAvailability({
  stockQuantity,
  className,
}: StockAvailabilityProps) {
  return (
    <p className={className}>
      {formatStockLabel(normalizeStockQuantity(stockQuantity)) ?? '—'}
    </p>
  );
}

export default StockAvailability;
