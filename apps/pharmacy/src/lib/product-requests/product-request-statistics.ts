import type { BrowserReadRequestOptions } from '@/lib/api/browser/request-options';
import { getPharmacyProductRequestStatistics as getPharmacyProductRequestStatisticsRequest } from '@/lib/api/browser/product-requests.api';

import type { ProductRequestStatisticsCounts } from './product-requests';

//===================================================================

export async function getPharmacyProductRequestStatistics(
  options?: BrowserReadRequestOptions
): Promise<ProductRequestStatisticsCounts> {
  return getPharmacyProductRequestStatisticsRequest(options);
}
