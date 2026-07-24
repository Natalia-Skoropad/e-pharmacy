import { type ClientStatisticsCounts } from '@e-pharmacy/config/clients';

import { getPharmacyClients } from '@/lib/api/browser';
import { DEFAULT_CLIENT_STATISTICS } from '@/lib/statistics/defaults';

//===================================================================

export async function getPharmacyClientStatistics(): Promise<ClientStatisticsCounts> {
  try {
    const [allClients, repeatClients, activeClients, blockedClients] =
      await Promise.all([
        getPharmacyClients({ page: 1, perPage: 1 }),
        getPharmacyClients({
          page: 1,
          perPage: 1,
          successfulOrders: 'repeat',
        }),
        getPharmacyClients({ page: 1, perPage: 1, status: 'active' }),
        getPharmacyClients({ page: 1, perPage: 1, status: 'blocked' }),
      ]);

    return {
      total: allClients.total,
      repeat: repeatClients.total,
      active: activeClients.total,
      blocked: blockedClients.total,
    };
  } catch {
    return DEFAULT_CLIENT_STATISTICS;
  }
}
