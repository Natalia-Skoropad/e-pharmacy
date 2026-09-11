import type {
  AllProductStatisticsCounts,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';
import type { EntityId } from '@e-pharmacy/types/primitives';

import { getPharmacyProducts, getProducts } from '@/lib/api/browser';

import type { PharmacyProductRow } from './products';

//===================================================================

export function getProductFinancialStats(products: PharmacyProductRow[]) {
  return products.reduce(
    (acc, product) => ({
      stockQuantity: acc.stockQuantity + product.stockQuantity,
      stockValue: acc.stockValue + product.stockQuantity * product.currentPrice,
      reservedQuantity: acc.reservedQuantity + product.reservedQuantity,

      reservedValue:
        acc.reservedValue + product.reservedQuantity * product.currentPrice,

      availableQuantity: acc.availableQuantity + product.availableQuantity,

      availableValue:
        acc.availableValue + product.availableQuantity * product.currentPrice,

      outOfStockProducts:
        acc.outOfStockProducts + (product.stockQuantity === 0 ? 1 : 0),
    }),
    {
      stockQuantity: 0,
      stockValue: 0,
      reservedQuantity: 0,
      reservedValue: 0,
      availableQuantity: 0,
      availableValue: 0,
      outOfStockProducts: 0,
    }
  );
}

//===================================================================

export async function getPharmacyOwnProductStatistics(
  pharmacyId: EntityId,
  options?: JsonResponseRequestOptions
): Promise<OwnProductStatisticsCounts> {
  const response = await getPharmacyProducts(
    {
      page: 1,
      perPage: 1,
      pharmacyId,
    },
    options
  );

  return response.statistics;
}

//===================================================================

export async function getPharmacyAllProductStatistics(
  pharmacyId: EntityId,
  options?: JsonResponseRequestOptions
): Promise<AllProductStatisticsCounts> {
  const [active, blocked, addedToPharmacy, notAddedToPharmacy] =
    await Promise.all([
      getProducts(
        {
          page: 1,
          perPage: 1,
          includeBlocked: true,
          status: 'active',
        },
        options
      ),

      getProducts(
        {
          page: 1,
          perPage: 1,
          includeBlocked: true,
          status: 'blocked',
        },
        options
      ),

      getProducts(
        {
          page: 1,
          perPage: 1,
          includeBlocked: true,
          addedToPharmacyId: pharmacyId,
          addedToMyPharmacy: true,
        },
        options
      ),

      getProducts(
        {
          page: 1,
          perPage: 1,
          includeBlocked: true,
          addedToPharmacyId: pharmacyId,
          addedToMyPharmacy: false,
        },
        options
      ),
    ]);

  return {
    active: active.total,
    blocked: blocked.total,
    addedToPharmacy: addedToPharmacy.total,
    notAddedToPharmacy: notAddedToPharmacy.total,
  };
}
