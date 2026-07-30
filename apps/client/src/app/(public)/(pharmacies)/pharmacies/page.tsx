import {
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySearchParams,
  type PharmacySearchParams,
} from '@/lib/catalog/pharmacies-catalog';

import { loadPharmaciesCatalogPageData } from '@/lib/catalog/pharmacies-catalog-server';
import { createPageMetadata } from '@/lib/seo/server';

import { PharmaciesPageContent } from '@/components/pharmacies';

//===================================================================

type PharmaciesPageProps = {
  searchParams?: Promise<PharmacySearchParams>;
};

//===================================================================

export async function generateMetadata({ searchParams }: PharmaciesPageProps) {
  const parsedFilters = parsePharmacySearchParams(await searchParams);

  return createPageMetadata({
    title: getPharmacyTitle(parsedFilters),
    description: getPharmacyDescription(parsedFilters),
    path: buildPharmacyPath(parsedFilters),
    noIndex: isPharmacyNoIndex(parsedFilters),
  });
}

//===================================================================

async function PharmaciesPage({ searchParams }: PharmaciesPageProps) {
  const parsedFilters = parsePharmacySearchParams(await searchParams);
  const pageData = await loadPharmaciesCatalogPageData(parsedFilters);

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesPage;
