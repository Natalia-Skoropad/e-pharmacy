'use client';

import { PHARMACY_STATUS_LABELS } from '@e-pharmacy/config/pharmacy';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

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

//===================================================================

export function getLockedFeatureBannerLabel(
  status: LockedFeatureBannerStatus
): string {
  return PHARMACY_STATUS_LABELS[status] ?? status;
}

//===================================================================

export function useCurrentPharmacyStatus() {
  const { profile, isLoading, error, refresh } = usePharmacyProfile();

  return {
    status: profile?.status ?? null,
    isLoading,
    error,
    refresh,
  };
}
