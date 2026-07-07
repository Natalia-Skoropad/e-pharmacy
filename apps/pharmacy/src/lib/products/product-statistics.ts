import type { EntityId } from '@e-pharmacy/types';

import {
  DEFAULT_OWN_PRODUCT_STATISTICS,
  type OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import { getPharmacyProducts } from '@/lib/api/browser';

import type {
  OwnProductStatus,
  PharmacyProductRow,
  StockAvailabilityFilter,
} from './products';

//===================================================================

export function getProductFinancialStats(products: PharmacyProductRow[]) {
  return products.reduce(
    (acc, product) => ({
      stockValue: acc.stockValue + product.stockQuantity * product.currentPrice,
      reservedValue:
        acc.reservedValue + product.reservedQuantity * product.currentPrice,
      availableValue:
        acc.availableValue + product.availableQuantity * product.currentPrice,
      reservedProducts:
        acc.reservedProducts + (product.reservedQuantity > 0 ? 1 : 0),
    }),
    {
      stockValue: 0,
      reservedValue: 0,
      availableValue: 0,
      reservedProducts: 0,
    }
  );
}

//===================================================================

async function getProductStatusTotal(
  pharmacyId: EntityId,
  status?: OwnProductStatus,
  stock?: StockAvailabilityFilter
): Promise<number> {
  const response = await getPharmacyProducts({
    page: 1,
    perPage: 100,
    pharmacyId,
    status,
    stock,
  });

  return response.total;
}

//===================================================================

export async function getPharmacyOwnProductStatistics(
  pharmacyId: EntityId
): Promise<OwnProductStatisticsCounts> {
  try {
    const [allProducts, active, blocked, inStock, outOfStock] =
      await Promise.all([
        getPharmacyProducts({ page: 1, perPage: 100, pharmacyId }),
        getProductStatusTotal(pharmacyId, 'active'),
        getProductStatusTotal(pharmacyId, 'blocked'),
        getProductStatusTotal(pharmacyId, undefined, 'available'),
        getProductStatusTotal(pharmacyId, undefined, 'empty'),
      ]);

    return {
      total: allProducts.total,
      active,
      blocked,
      inStock,
      outOfStock,
      reserved: getProductFinancialStats(allProducts.items).reservedProducts,
    };
  } catch {
    return DEFAULT_OWN_PRODUCT_STATISTICS;
  }
}
