import 'server-only';
import type { Metadata } from 'next';

import { PharmacyDetailsPageContent } from '@/components/pharmacies';
import { buildPharmacyPath, getIdFromSlugId } from '@/lib/routes';
import { PUBLIC_API_CACHE_OPTIONS } from '@/lib/api/server';
import { createPageMetadata } from '@/lib/seo';

import {
  getPharmacyDetails,
  getPharmacyReviews,
} from '@/lib/api/server';

import type { Pharmacy } from '@e-pharmacy/types';

//===================================================================

export async function getPharmacyBySlugId(slugId: string): Promise<Pharmacy | null> {
  const pharmacyId = getIdFromSlugId(slugId);

  if (!pharmacyId) return null;

  const pharmacyData = await getPharmacyDetails(
    pharmacyId,
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return pharmacyData?.pharmacy ?? null;
}

//===================================================================

export function createPharmacyDetailMetadata(pharmacy: Pharmacy): Metadata {
  return createPageMetadata({
    title: `${pharmacy.name} pharmacy details`,
    description:
      pharmacy.description ??
      `View ${pharmacy.name} address, phone number, email, working hours, rating, reviews, and available products on E-PHARMACY.`,
    path: buildPharmacyPath(pharmacy.name, pharmacy.id),
    image: pharmacy.imageUrl,
    imageAlt: `${pharmacy.name} pharmacy storefront`,
  });
}

//===================================================================

export async function renderPharmacyDetailPage(pharmacy: Pharmacy) {
  const reviewsData = await getPharmacyReviews(
    pharmacy.id,
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return (
    <PharmacyDetailsPageContent
      pharmacy={pharmacy}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? pharmacy.reviewsCount ?? 0}
      areReviewsUnavailable={!reviewsData}
    />
  );
}
