import { formatStockLabel } from '@/lib/formatters';

//===================================================================

type StockAvailabilityProps = {
  stockQuantity: number;
  className?: string;
};

//===================================================================

function StockAvailability({
  stockQuantity,
  className,
}: StockAvailabilityProps) {
  return <p className={className}>{formatStockLabel(stockQuantity)}</p>;
}

export default StockAvailability;
