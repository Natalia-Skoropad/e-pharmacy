import { type ClientStatisticsCounts } from '@e-pharmacy/config/clients';
import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/core';

import { getPharmacyClients } from '@/lib/api/browser';
import { DEFAULT_CLIENT_STATISTICS } from '@/lib/statistics/defaults';

//===================================================================

export async function getPharmacyClientStatistics(
  options?: JsonResponseRequestOptions
): Promise<ClientStatisticsCounts> {
  try {
    const [allClients, repeatClients, activeClients, blockedClients] =
      await Promise.all([
        getPharmacyClients({ page: 1, perPage: 1 }, options),
        getPharmacyClients(
          {
            page: 1,
            perPage: 1,
            successfulOrders: 'repeat',
          },
          options
        ),
        getPharmacyClients(
          { page: 1, perPage: 1, status: 'active' },
          options
        ),
        getPharmacyClients(
          { page: 1, perPage: 1, status: 'blocked' },
          options
        ),
      ]);

    return {
      total: allClients.total,
      repeat: repeatClients.total,
      active: activeClients.total,
      blocked: blockedClients.total,
    };
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    return DEFAULT_CLIENT_STATISTICS;
  }
}
