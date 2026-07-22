import type { PharmacyProfile } from '@e-pharmacy/types';
import { buildSlugId } from '@e-pharmacy/validation/url';

//===================================================================

const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL?.trim() || 'http://localhost:3000';

//===================================================================

export function getClientAppUrl(): string {
  return CLIENT_APP_URL;
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

  return `${CLIENT_APP_URL}/${buildSlugId(pharmacy.name, pharmacy.id)}`;
}
