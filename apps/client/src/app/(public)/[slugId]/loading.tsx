'use client';

import { useParams } from 'next/navigation';

import { parsePublicEntitySlugId } from '@e-pharmacy/validation/url';

import {
  PharmacyDetailsLoading,
  type PharmacyLoadingTab,
} from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsLoading';

//===================================================================

export default function PublicEntityDetailsLoading() {
  const params = useParams<{ slugId: string; tab: string }>();
  const slugId = params?.slugId;

  if (!slugId || parsePublicEntitySlugId(slugId)?.entityType !== 'pharmacy') {
    return null;
  }

  const tab: PharmacyLoadingTab =
    params.tab === 'bank-details'
      ? 'payment'
      : params.tab === 'about'
        ? 'about'
        : params.tab === 'reviews'
          ? 'reviews'
          : 'details';

  return <PharmacyDetailsLoading tab={tab} />;
}
