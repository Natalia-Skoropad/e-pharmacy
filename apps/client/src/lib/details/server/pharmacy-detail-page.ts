import 'server-only';
import type { Metadata } from 'next';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';
import { getIdFromSlugId } from '@e-pharmacy/validation/url';

import {
  getServerDataErrorContext,
  getPharmacyDetails,
  PUBLIC_API_CACHE_OPTIONS,
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
  const pharmacyId = getIdFromSlugId(slugId);
  if (!pharmacyId) return { status: 'not_found' };

  try {
    const pharmacyData = await getPharmacyDetails(
      pharmacyId,
      PUBLIC_API_CACHE_OPTIONS
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

export function createPharmacyDetailMetadata(
  pharmacy: PublicPharmacy
): Metadata {
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
