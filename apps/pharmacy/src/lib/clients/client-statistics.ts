import {
  DEFAULT_CLIENT_STATISTICS,
  type ClientStatisticsCounts,
} from '@e-pharmacy/types/clients';

import { getPharmacyClients } from '@/lib/api/browser';

//===================================================================

export async function getPharmacyClientStatistics(): Promise<ClientStatisticsCounts> {
  try {
    const [allClients, activeClients, blockedClients] = await Promise.all([
      getPharmacyClients({ page: 1, perPage: 100 }),
      getPharmacyClients({ page: 1, perPage: 1, status: 'active' }),
      getPharmacyClients({ page: 1, perPage: 1, status: 'blocked' }),
    ]);

    const repeatClients = allClients.items.filter(
      (client) => client.successfulOrdersCount > 1
    ).length;

    return {
      total: allClients.total,
      repeat: repeatClients,
      active: activeClients.total,
      blocked: blockedClients.total,
    };
  } catch {
    return DEFAULT_CLIENT_STATISTICS;
  }
}
