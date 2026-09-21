import type {
  AllProductStatisticsCounts,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

//===================================================================

type RemovedOwnProductStatisticsInput = Readonly<{
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  currentPrice: number;
}>;

//===================================================================

function subtractNonNegative(value: number, delta: number): number {
  return Math.max(0, value - delta);
}

//===================================================================

export function applyAddedProductStatistics(
  current: AllProductStatisticsCounts
): AllProductStatisticsCounts {
  return {
    ...current,
    addedToPharmacy: current.addedToPharmacy + 1,
    notAddedToPharmacy: subtractNonNegative(current.notAddedToPharmacy, 1),
  };
}

//===================================================================

export function applyRemovedOwnProductStatistics(
  current: OwnProductStatisticsCounts,
  product: RemovedOwnProductStatisticsInput
): OwnProductStatisticsCounts {
  const stockAmount = product.stockQuantity * product.currentPrice;
  const reservedAmount = product.reservedQuantity * product.currentPrice;
  const availableAmount = product.availableQuantity * product.currentPrice;

  return {
    inStock: {
      quantity: subtractNonNegative(
        current.inStock.quantity,
        product.stockQuantity
      ),
      amount: subtractNonNegative(current.inStock.amount ?? 0, stockAmount),
    },

    reserved: {
      quantity: subtractNonNegative(
        current.reserved.quantity,
        product.reservedQuantity
      ),
      amount: subtractNonNegative(current.reserved.amount ?? 0, reservedAmount),
    },

    available: {
      quantity: subtractNonNegative(
        current.available.quantity,
        product.availableQuantity
      ),
      amount: subtractNonNegative(
        current.available.amount ?? 0,
        availableAmount
      ),
    },

    outOfStock: {
      quantity:
        product.stockQuantity === 0
          ? subtractNonNegative(current.outOfStock.quantity, 1)
          : current.outOfStock.quantity,
    },
  };
}
