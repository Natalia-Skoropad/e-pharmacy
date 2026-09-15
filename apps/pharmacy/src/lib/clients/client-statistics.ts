import type { BrowserReadRequestOptions } from '@/lib/api/browser/request-options';
import { getPharmacyClients } from '@/lib/api/browser';
import { type ClientStatisticsCounts } from '@/lib/statistics/config';

//===================================================================

export async function getPharmacyClientStatistics(
  options?: BrowserReadRequestOptions
): Promise<ClientStatisticsCounts> {
  const response = await getPharmacyClients({ page: 1, perPage: 1 }, options);
  return response.statistics;
}
