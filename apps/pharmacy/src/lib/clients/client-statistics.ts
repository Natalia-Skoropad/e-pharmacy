import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

import { getPharmacyClients } from '@/lib/api/browser';
import { type ClientStatisticsCounts } from '@/lib/statistics/config';

//===================================================================

export async function getPharmacyClientStatistics(
  options?: JsonResponseRequestOptions
): Promise<ClientStatisticsCounts> {
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
      getPharmacyClients({ page: 1, perPage: 1, status: 'active' }, options),
      getPharmacyClients({ page: 1, perPage: 1, status: 'blocked' }, options),
    ]);

  return {
    total: allClients.total,
    repeat: repeatClients.total,
    active: activeClients.total,
    blocked: blockedClients.total,
  };
}
