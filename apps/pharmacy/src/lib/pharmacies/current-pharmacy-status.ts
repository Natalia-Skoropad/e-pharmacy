import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type LockedFeatureBannerStatus = Exclude<
  PharmacyStatus,
  'active' | 'on_moderation'
>;

//===================================================================

export function isPharmacyOperationalStatus(
  pharmacyStatus: PharmacyStatus | null | undefined
): boolean {
  return pharmacyStatus === 'active' || pharmacyStatus === 'on_moderation';
}

//===================================================================

export function getLockedFeatureBannerStatus(
  pharmacyStatus: PharmacyStatus | null | undefined
): LockedFeatureBannerStatus | null {
  if (
    pharmacyStatus === 'new' ||
    pharmacyStatus === 'on_verification' ||
    pharmacyStatus === 'blocked'
  ) {
    return pharmacyStatus;
  }

  return null;
}
