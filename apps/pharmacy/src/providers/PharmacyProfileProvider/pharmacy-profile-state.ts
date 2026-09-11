import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type PharmacyProfileSnapshot = Readonly<{
  identity: string;
  profile: CurrentPharmacySummary | null;
  isLoading: boolean;
  error: unknown;
}>;

//===================================================================

export function createPharmacyProfileRefreshStartSnapshot(
  currentSnapshot: PharmacyProfileSnapshot | null,
  identity: string
): PharmacyProfileSnapshot {
  const currentProfile =
    currentSnapshot?.identity === identity ? currentSnapshot.profile : null;

  return {
    identity,
    profile: currentProfile,
    isLoading: currentProfile === null,
    error: null,
  };
}

//===================================================================

export function createPharmacyProfileRefreshErrorSnapshot(
  currentSnapshot: PharmacyProfileSnapshot | null,
  identity: string,
  error: unknown
): PharmacyProfileSnapshot {
  return {
    identity,
    profile:
      currentSnapshot?.identity === identity ? currentSnapshot.profile : null,
    isLoading: false,
    error,
  };
}
