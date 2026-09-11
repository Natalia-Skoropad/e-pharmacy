import type {
  AllProductStatisticsCounts,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import type { EntityId } from '@e-pharmacy/types/primitives';

import type { BrowserReadRequestOptions } from '@/lib/api/browser/request-options';
import { getPharmacyProducts, getProducts } from '@/lib/api/browser';

//===================================================================

export async function getPharmacyOwnProductStatistics(
  pharmacyId: EntityId,
  options?: BrowserReadRequestOptions
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
  options?: BrowserReadRequestOptions
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
