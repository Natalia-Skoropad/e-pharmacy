import 'server-only';

import type { Metadata } from 'next';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import {
  getIdFromSlugId,
  getPharmacyIdFromPublicSlugId,
} from '@e-pharmacy/validation/url';

import {
  getServerDataErrorContext,
  getPharmacyDetails,
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  type ServerDataErrorContext,
} from '@/lib/api/server';

import { buildPharmacyPath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo/server';

//===================================================================

export type PharmacyDetailLookupResult =
  | { status: 'found'; pharmacy: PublicPharmacy }
  | { status: 'not_found' }
  | ({ status: 'unavailable' } & ServerDataErrorContext);

//===================================================================

export async function lookupPharmacyBySlugId(
  slugId: string
): Promise<PharmacyDetailLookupResult> {
  const pharmacyId =
    getPharmacyIdFromPublicSlugId(slugId) ?? getIdFromSlugId(slugId);

  if (!pharmacyId) return { status: 'not_found' };

  try {
    const pharmacyData = await getPharmacyDetails(
      pharmacyId,
      PUBLIC_COMMERCE_CACHE_OPTIONS
    );

    return pharmacyData.pharmacy
      ? { status: 'found', pharmacy: pharmacyData.pharmacy }
      : { status: 'not_found' };
  } catch (error) {
    if (isApiError(error) && error.httpStatus === 404) {
      return { status: 'not_found' };
    }

    return { status: 'unavailable', ...getServerDataErrorContext(error) };
  }
}

//===================================================================

/** Metadata titles reflect the active tab; no private payment fields are used. */
export type PharmacyMetadataTab = 'details' | 'payment' | 'about' | 'reviews';

export function createPharmacyDetailMetadata(
  pharmacy: PublicPharmacy,
  tab: PharmacyMetadataTab = 'details'
): Metadata {
  const pharmacyName = pharmacy.name.trim();
  const displayName = pharmacyName.replace(/^Pharmacy\s+/i, '').trim();

  const title =
    tab === 'payment'
      ? `${displayName} pharmacy bank details`
      : tab === 'about'
        ? `About ${displayName} pharmacy`
        : tab === 'reviews'
          ? `${displayName} pharmacy reviews`
          : `${displayName} pharmacy details`;

  const basePath = buildPharmacyPath(
    pharmacy.name,
    pharmacy.id,
    pharmacy.publicSlugId
  );

  const path =
    tab === 'details'
      ? basePath
      : `${basePath}/${tab === 'payment' ? 'bank-details' : tab}`;

  const description =
    pharmacy.shortDescription?.trim() ||
    `View ${pharmacyName} address, phone number, email, working hours, rating, reviews, and available products on E-PHARMACY.`;

  const metadata = createPageMetadata({
    title,
    description,
    path,
    image: pharmacy.imageUrl,
    imageAlt: `${pharmacyName} pharmacy storefront`,
    noIndex: tab === 'payment',
  });

  // A bank-details URL is accessible only to signed-in users. A shared
  // preview may show PUBLIC pharmacy copy/photo, never private bank data.
  return tab === 'payment'
    ? { ...metadata, robots: { index: false, follow: false, nocache: true } }
    : metadata;
}
