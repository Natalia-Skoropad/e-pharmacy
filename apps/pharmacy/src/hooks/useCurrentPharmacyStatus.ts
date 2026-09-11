'use client';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

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
