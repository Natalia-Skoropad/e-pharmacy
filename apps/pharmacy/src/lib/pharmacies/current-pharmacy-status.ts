'use client';

import { useEffect, useState } from 'react';

import type { PharmacyStatus } from '@e-pharmacy/types';
import { getMyPharmacyProfile } from '@/lib/api/browser';
import { PHARMACY_STATUS_LABELS } from '@/lib/pharmacies/status';

//===================================================================

export type LockedFeatureBannerStatus = 'new' | 'on_verification';

//===================================================================

export function getLockedFeatureBannerStatus(
  pharmacyStatus: PharmacyStatus | null | undefined
): LockedFeatureBannerStatus {
  return pharmacyStatus === 'on_verification' ? 'on_verification' : 'new';
}

//===================================================================

export function getLockedFeatureBannerLabel(
  status: LockedFeatureBannerStatus
): string {
  return PHARMACY_STATUS_LABELS[status] ?? status;
}

//===================================================================

export function useCurrentPharmacyStatus(
  fallbackStatus: PharmacyStatus = 'new'
): PharmacyStatus {
  const [status, setStatus] = useState<PharmacyStatus>(fallbackStatus);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await getMyPharmacyProfile();

        if (isMounted) setStatus(response.pharmacy.status);
      } catch {
        if (isMounted) setStatus(fallbackStatus);
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, [fallbackStatus]);

  return status;
}
