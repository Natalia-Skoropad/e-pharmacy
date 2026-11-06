import type { PharmacyClientRow } from '@/lib/clients/clients';

//===================================================================

/** Keep walk-in accounts from different pharmacies distinguishable. */
export function getClientDisplayName(client: PharmacyClientRow): string {
  return client.isDefault && client.pharmacyName
    ? `${client.name} (${client.pharmacyName})`
    : client.name;
}
