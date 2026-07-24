'use client';

import { useEffect, useState } from 'react';

import { PHARMACY_STATUS_LABELS } from '@e-pharmacy/config/pharmacy';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import { getMyPharmacyProfile } from '@/lib/api/browser';

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

export function useCurrentPharmacyStatus(): PharmacyStatus | null {
  const [status, setStatus] = useState<PharmacyStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await getMyPharmacyProfile();

        if (isMounted) setStatus(response.pharmacy.status);
      } catch {
        if (isMounted) setStatus(null);
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
}
