import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/core';

import { getPharmacyProductRequests } from '@/lib/api/browser/product-requests.api';

import {
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestStatisticsCounts,
} from './product-requests';

//===================================================================

export async function getPharmacyProductRequestStatistics(
  options?: JsonResponseRequestOptions
): Promise<ProductRequestStatisticsCounts> {
  const statistics = { ...DEFAULT_PRODUCT_REQUEST_STATISTICS };

  const statusTotals = await Promise.all(
    PRODUCT_REQUEST_STATUSES.map(async (status) => {
      const response = await getPharmacyProductRequests(
        {
          page: 1,
          perPage: 1,
          status,
        },
        options
      );

      return [status, response.total] as const;
    })
  );

  statusTotals.forEach(([status, total]) => {
    statistics[status] = total;
  });

  return statistics;
}
