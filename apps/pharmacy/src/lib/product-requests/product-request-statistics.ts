import {
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  PRODUCT_REQUEST_STATUSES,
  type ProductRequestStatisticsCounts,
} from '@e-pharmacy/types/product-requests';

import { getPharmacyProductRequests } from '@/lib/api/browser/product-requests.api';

//===================================================================

export async function getPharmacyProductRequestStatistics(): Promise<ProductRequestStatisticsCounts> {
  const statistics = { ...DEFAULT_PRODUCT_REQUEST_STATISTICS };

  const statusTotals = await Promise.all(
    PRODUCT_REQUEST_STATUSES.map(async (status) => {
      const response = await getPharmacyProductRequests({
        page: 1,
        perPage: 1,
        status,
      });

      return [status, response.total] as const;
    })
  );

  statusTotals.forEach(([status, total]) => {
    statistics[status] = total;
  });

  return statistics;
}
