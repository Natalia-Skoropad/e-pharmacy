import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';

import {
  getIdFromSlugId,
  getPharmacyIdFromPublicSlugId,
} from '@e-pharmacy/validation/url';

import {
  buildPharmacyCanonicalPath,
  buildPharmacyPath as buildPharmaciesCatalogPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyCatalogSegment,
  isPharmacyNoIndex,
  mergePharmacyCatalogFilters,
  parsePharmacySearchParams,
  parsePharmacySegments,
  type PharmacyRouteParams,
  type PharmacySearchParams,
} from '@/lib/catalog/pharmacies-catalog';

import {
  loadPharmaciesCatalogPageData,
  resolvePharmaciesCatalogFilters,
} from '@/lib/catalog/pharmacies-catalog-server';

import { hasCatalogSearchParams } from '@/lib/catalog/catalog-param-utils';

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
  searchParams?: Promise<PharmacySearchParams>;
};

//===================================================================

const resolvePharmacy = cache(lookupPharmacyBySlugId);

//===================================================================

function getDetailSlugId(params?: PharmacyRouteParams): string | null {
  const segments = params?.segments;
  if (!segments || segments.length !== 1) return null;

  const [segment] = segments;
  if (getPharmacyIdFromPublicSlugId(segment)) return segment;
  if (isPharmacyCatalogSegment(segment)) return null;

  return getIdFromSlugId(segment) ? segment : null;
}

//===================================================================

export async function generateMetadata({
  params,
  searchParams,
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

  const routeFilters = parsePharmacySegments(resolvedParams).filters;
  const queryFilters = parsePharmacySearchParams(await searchParams);
  const { filters } = await resolvePharmaciesCatalogFilters(
    mergePharmacyCatalogFilters(routeFilters, queryFilters)
  );

  return createPageMetadata({
    title: getPharmacyTitle(filters),
    description: getPharmacyDescription(filters),
    path: buildPharmacyCanonicalPath(filters),
    noIndex: isPharmacyNoIndex(filters),
  });
}

//===================================================================

async function PharmaciesSegmentsPage({
  params,
  searchParams,
}: PharmaciesSegmentsPageProps) {
  const resolvedParams = await params;
  const detailSlugId = getDetailSlugId(resolvedParams);

  if (detailSlugId) {
    const result = await resolvePharmacy(detailSlugId);

    if (result.status === 'unavailable') {
      return <DetailsUnavailablePage entityLabel="pharmacy" error={result} />;
    }

    if (result.status === 'not_found') notFound();

    permanentRedirect(
      buildPharmacyDetailsPath(
        result.pharmacy.name,
        result.pharmacy.id,
        result.pharmacy.publicSlugId
      )
    );
  }

  const routeResult = parsePharmacySegments(resolvedParams);
  const resolvedSearchParams = await searchParams;

  const filters = mergePharmacyCatalogFilters(
    routeResult.filters,
    parsePharmacySearchParams(resolvedSearchParams)
  );

  const pageData = await loadPharmaciesCatalogPageData(filters);
  const canonicalPath = buildPharmaciesCatalogPath(pageData.filters);
  const currentPath = resolvedParams?.segments?.length
    ? `${ROUTES.PHARMACIES}/${resolvedParams.segments.join('/')}`
    : ROUTES.PHARMACIES;

  if (
    !routeResult.isCanonical ||
    hasCatalogSearchParams(resolvedSearchParams) ||
    currentPath !== canonicalPath
  ) {
    permanentRedirect(canonicalPath);
  }

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesSegmentsPage;
