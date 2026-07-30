import 'server-only';

import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import {
  getPharmacyReviews,
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import PharmacyDetailsPageContent from '../PharmacyDetailsPageContent/PharmacyDetailsPageContent';

//===================================================================

export async function PharmacyDetailPage({
  pharmacy,
}: Readonly<{ pharmacy: PublicPharmacy }>) {
  const reviewsState = await resolveServerDataState(
    getPharmacyReviews(pharmacy.id, PUBLIC_API_CACHE_OPTIONS)
  );

  if (reviewsState.status === 'unavailable') {
    console.error('Pharmacy reviews unavailable', {
      pharmacyId: pharmacy.id,
      reason: reviewsState.reason,
      requestId: reviewsState.requestId,
      httpStatus: reviewsState.httpStatus,
    });
  }

  const reviewsData =
    reviewsState.status === 'success' ? reviewsState.data : null;

  return (
    <PharmacyDetailsPageContent
      pharmacy={pharmacy}
      reviews={[...(reviewsData?.items ?? [])]}
      reviewsTotal={reviewsData?.total ?? pharmacy.reviewsCount ?? 0}
      areReviewsUnavailable={reviewsState.status === 'unavailable'}
    />
  );
}
