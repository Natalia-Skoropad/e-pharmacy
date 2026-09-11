import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type LockedFeatureBannerStatus = 'new' | 'on_verification';

//===================================================================

export function getLockedFeatureBannerStatus(
  pharmacyStatus: PharmacyStatus | null | undefined
): LockedFeatureBannerStatus | null {
  if (pharmacyStatus === 'new' || pharmacyStatus === 'on_verification') {
    return pharmacyStatus;
  }

  return null;
}
