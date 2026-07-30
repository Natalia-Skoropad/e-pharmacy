import { redirect } from 'next/navigation';

import {
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySegments,
  type PharmacyRouteParams,
} from '@/lib/catalog/pharmacies-catalog';

import { loadPharmaciesCatalogPageData } from '@/lib/catalog/pharmacies-catalog-server';
import { createPageMetadata } from '@/lib/seo/server';

import { PharmaciesPageContent } from '@/components/pharmacies';

//===================================================================

type PharmaciesSegmentsPageProps = {
  params?: Promise<PharmacyRouteParams>;
};

//===================================================================

export async function generateMetadata({
  params,
}: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params).filters;

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmacyPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesSegmentsPage({ params }: PharmaciesSegmentsPageProps) {
  const routeResult = parsePharmacySegments(await params);

  if (!routeResult.isCanonical) {
    redirect(buildPharmacyPath(routeResult.filters));
  }

  const pageData = await loadPharmaciesCatalogPageData(routeResult.filters);

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesSegmentsPage;
