import 'server-only';
import type { Metadata } from 'next';

import { PharmacyDetailsPageContent } from '@/components/pharmacies';
import { buildPharmacyPath, getIdFromSlugId } from '@/lib/routes';

import {
  getDataUnavailableReason,
  PUBLIC_API_CACHE_OPTIONS,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo';

import { getPharmacyDetails, getPharmacyReviews } from '@/lib/api/server';

import { ApiError } from '@e-pharmacy/api-client/core';
import type { Pharmacy } from '@e-pharmacy/types';
import type { DataUnavailableReason } from '@/lib/api/server';

//===================================================================

export type PharmacyDetailLookupResult =
  | { status: 'found'; pharmacy: Pharmacy }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: DataUnavailableReason };

//===================================================================

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

//===================================================================

export async function lookupPharmacyBySlugId(
  slugId: string
): Promise<PharmacyDetailLookupResult> {
  const pharmacyId = getIdFromSlugId(slugId);

  if (!pharmacyId) return { status: 'not_found' };

  try {
    const pharmacyData = await getPharmacyDetails(
      pharmacyId,
      PUBLIC_API_CACHE_OPTIONS
    );

    return pharmacyData?.pharmacy
      ? { status: 'found', pharmacy: pharmacyData.pharmacy }
      : { status: 'not_found' };
  } catch (error) {
    if (isNotFoundError(error)) return { status: 'not_found' };

    return {
      status: 'unavailable',
      reason: getDataUnavailableReason(error),
    };
  }
}

//===================================================================

export async function getPharmacyBySlugId(
  slugId: string
): Promise<Pharmacy | null> {
  const result = await lookupPharmacyBySlugId(slugId);

  return result.status === 'found' ? result.pharmacy : null;
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
