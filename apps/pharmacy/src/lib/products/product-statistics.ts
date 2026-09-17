import type {
  AllProductStatisticsCounts,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import type { EntityId } from '@e-pharmacy/types/primitives';

import type { BrowserReadRequestOptions } from '@/lib/api/browser/request-options';

import {
  getPharmacyAllProductStatistics as getPharmacyAllProductStatisticsRequest,
  getPharmacyProducts,
} from '@/lib/api/browser';

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
  options?: BrowserReadRequestOptions
): Promise<AllProductStatisticsCounts> {
  return getPharmacyAllProductStatisticsRequest(options);
}
