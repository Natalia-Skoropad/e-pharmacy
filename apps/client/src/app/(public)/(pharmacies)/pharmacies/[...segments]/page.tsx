import { cache } from 'react';
import { notFound, permanentRedirect, redirect } from 'next/navigation';

import {
  getIdFromSlugId,
  getPharmacyIdFromPublicSlugId,
} from '@e-pharmacy/validation/url';

import {
  buildPharmacyPath as buildPharmaciesCatalogPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySegments,
  type PharmacyRouteParams,
} from '@/lib/catalog/pharmacies-catalog';

import { loadPharmaciesCatalogPageData } from '@/lib/catalog/pharmacies-catalog-server';

import {
  createPharmacyDetailMetadata,
  lookupPharmacyBySlugId,
} from '@/lib/details';

import {
  buildPharmacyPath as buildPharmacyDetailsPath,
  ROUTES,
} from '@/lib/routes';

import { createPageMetadata } from '@/lib/seo/server';

import { DetailsUnavailablePage } from '@/components/common/DetailsUnavailablePage';
import { PharmaciesPageContent } from '@/components/pharmacies';

//===================================================================

type PharmaciesSegmentsPageProps = {
  params?: Promise<PharmacyRouteParams>;
};

//===================================================================

const resolvePharmacy = cache(lookupPharmacyBySlugId);

//===================================================================

function getDetailSlugId(params?: PharmacyRouteParams): string | null {
  const segments = params?.segments;
  if (!segments || segments.length !== 1) return null;

  const pharmacyId =
    getPharmacyIdFromPublicSlugId(segments[0]) ?? getIdFromSlugId(segments[0]);

  return pharmacyId ? segments[0] : null;
}

//===================================================================

export async function generateMetadata({
  params,
}: PharmaciesSegmentsPageProps) {
  const resolvedParams = await params;
  const detailSlugId = getDetailSlugId(resolvedParams);

  if (detailSlugId) {
    const result = await resolvePharmacy(detailSlugId);

    if (result.status === 'unavailable') {
      return createPageMetadata({
        title: 'Pharmacy temporarily unavailable',
        description: 'The requested pharmacy could not be loaded right now.',
        path: `${ROUTES.PHARMACIES}/${detailSlugId}`,
        noIndex: true,
      });
    }

    if (result.status === 'not_found') {
      return createPageMetadata({
        title: 'Pharmacy Not Found',
        description: 'The requested pharmacy could not be found.',
        path: `${ROUTES.PHARMACIES}/${detailSlugId}`,
        noIndex: true,
      });
    }

    return createPharmacyDetailMetadata(result.pharmacy);
  }

  const parsedFilters = parsePharmacySegments(resolvedParams).filters;

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmaciesCatalogPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesSegmentsPage({ params }: PharmaciesSegmentsPageProps) {
  const resolvedParams = await params;
  const detailSlugId = getDetailSlugId(resolvedParams);

  if (detailSlugId) {
    const result = await resolvePharmacy(detailSlugId);

    if (result.status === 'unavailable') {
      return (
        <DetailsUnavailablePage entityLabel="pharmacy" reason={result.reason} />
      );
    }

    if (result.status === 'not_found') notFound();

    const canonicalPath = buildPharmacyDetailsPath(
      result.pharmacy.name,
      result.pharmacy.id,
      result.pharmacy.publicSlugId
    );

    permanentRedirect(canonicalPath);
  }

  const routeResult = parsePharmacySegments(resolvedParams);

  if (!routeResult.isCanonical) {
    redirect(buildPharmaciesCatalogPath(routeResult.filters));
  }

  const pageData = await loadPharmaciesCatalogPageData(routeResult.filters);

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesSegmentsPage;
