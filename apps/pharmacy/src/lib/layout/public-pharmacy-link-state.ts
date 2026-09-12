import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';

import {
  canOpenClientPharmacyPage,
  getClientPharmacyUrl,
} from './external-links';

//===================================================================

export type PublicPharmacyLinkState =
  | Readonly<{
      status: 'available';
      href: string;
      label: 'Go to my pharmacy on the website';
    }>
  | Readonly<{
      status: 'loading' | 'error' | 'inactive' | 'unavailable';
      label: string;
    }>;

//===================================================================

export function getPublicPharmacyLinkState({
  profile,
  isLoading,
  error,
}: Readonly<{
  profile: CurrentPharmacySummary | null;
  isLoading: boolean;
  error: unknown;
}>): PublicPharmacyLinkState {
  if (profile) {
    if (!canOpenClientPharmacyPage(profile.status)) {
      return {
        status: 'inactive',
        label: 'My pharmacy website is unavailable for the current status',
      };
    }

    const href = getClientPharmacyUrl(profile);

    if (href) {
      return {
        status: 'available',
        href,
        label: 'Go to my pharmacy on the website',
      };
    }

    return {
      status: 'unavailable',
      label: 'My pharmacy website is unavailable',
    };
  }

  if (isLoading) {
    return {
      status: 'loading',
      label: 'Loading my pharmacy website...',
    };
  }

  if (error) {
    return {
      status: 'error',
      label: 'My pharmacy website is temporarily unavailable',
    };
  }

  return {
    status: 'unavailable',
    label: 'My pharmacy website is unavailable',
  };
}
