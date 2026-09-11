import type { PharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { buildSlugId } from '@e-pharmacy/validation/url';

import { requireClientAppConfiguration } from '@/lib/auth/client-app-config';

//===================================================================

export function getClientAppUrl(): string {
  return requireClientAppConfiguration().baseUrl;
}

//===================================================================

export function canOpenClientPharmacyPage(
  status?: PharmacyProfile['status']
): boolean {
  return status === 'active' || status === 'on_moderation';
}

//===================================================================

export function getClientPharmacyUrl(
  pharmacy?: Pick<PharmacyProfile, 'id' | 'name'> | null
): string | undefined {
  if (!pharmacy?.id) return undefined;

  const clientApp = requireClientAppConfiguration();
  const pharmacyPath = `${clientApp.basePath}/${buildSlugId(
    pharmacy.name,
    pharmacy.id
  )}`;

  return new URL(pharmacyPath, clientApp.origin).toString();
}
