import type { PharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { buildPublicEntitySlugId } from '@e-pharmacy/validation/url';

import {
  getClientAppConfiguration,
  requireClientAppConfiguration,
} from '@/lib/auth/client-app-config';

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

  const result = getClientAppConfiguration();

  if (!result.ok) return undefined;

  const clientApp = result.config;

  const pharmacyPath = `${clientApp.basePath}/${buildPublicEntitySlugId(
    'pharmacy',
    pharmacy.name,
    pharmacy.id
  )}`;

  return new URL(pharmacyPath, clientApp.origin).toString();
}
