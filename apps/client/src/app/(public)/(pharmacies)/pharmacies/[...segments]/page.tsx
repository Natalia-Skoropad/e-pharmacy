import {
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySegments,
  type PharmacyRouteParams,
} from '@/lib/catalog/pharmacies-catalog';

import { loadPharmaciesCatalogPageData } from '@/lib/catalog/pharmacies-catalog-server';
import { createPageMetadata } from '@/lib/seo';

import { PharmaciesPageContent } from '@/components/pharmacies';

//===================================================================

type PharmaciesSegmentsPageProps = {
  params?: Promise<PharmacyRouteParams>;
};

//===================================================================

export async function generateMetadata({
  params,
}: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params);

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmacyPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesSegmentsPage({ params }: PharmaciesSegmentsPageProps) {
  const parsedFilters = parsePharmacySegments(await params);
  const pageData = await loadPharmaciesCatalogPageData(parsedFilters);

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesSegmentsPage;
