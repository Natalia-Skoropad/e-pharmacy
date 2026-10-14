import 'server-only';

import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import {
  getPharmacyReviews,
  PUBLIC_REVIEWS_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import PharmacyDetailsPageContent from '../PharmacyDetailsPageContent/PharmacyDetailsPageContent';
import type { PharmacyTab } from '../PharmacyDetailsPageContent/PharmacyDetailsTabs';

//===================================================================

export async function PharmacyDetailPage({
  pharmacy,
  initialTab = 'details',
}: Readonly<{ pharmacy: PublicPharmacy; initialTab?: PharmacyTab }>) {
  const reviewsState = await resolveServerDataState(
    getPharmacyReviews(pharmacy.id, PUBLIC_REVIEWS_CACHE_OPTIONS)
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
      initialTab={initialTab}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? pharmacy.reviewsCount ?? 0}
      areReviewsUnavailable={reviewsState.status === 'unavailable'}
    />
  );
}
