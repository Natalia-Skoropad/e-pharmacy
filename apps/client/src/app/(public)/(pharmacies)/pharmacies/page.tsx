import { permanentRedirect } from 'next/navigation';

import {
  buildPharmacyCanonicalPath,
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmacyTitle,
  isPharmacyNoIndex,
  parsePharmacySearchParams,
  type PharmacySearchParams,
} from '@/lib/catalog/pharmacies-catalog';

import {
  loadPharmaciesCatalogPageData,
  resolvePharmaciesCatalogFilters,
} from '@/lib/catalog/pharmacies-catalog-server';

import { hasCatalogSearchParams } from '@/lib/catalog/catalog-param-utils';
import { createPageMetadata } from '@/lib/seo/server';

import { PharmaciesPageContent } from '@/components/pharmacies';

//===================================================================

type PharmaciesPageProps = {
  searchParams?: Promise<PharmacySearchParams>;
};

//===================================================================

export async function generateMetadata({ searchParams }: PharmaciesPageProps) {
  const parsedFilters = parsePharmacySearchParams(await searchParams);
  const { filters } = await resolvePharmaciesCatalogFilters(parsedFilters);

  return createPageMetadata({
    title: getPharmacyTitle(filters),
    description: getPharmacyDescription(filters),
    path: buildPharmacyCanonicalPath(filters),
    noIndex: isPharmacyNoIndex(filters),
  });
}

//===================================================================

async function PharmaciesPage({ searchParams }: PharmaciesPageProps) {
  const resolvedSearchParams = await searchParams;
  const parsedFilters = parsePharmacySearchParams(resolvedSearchParams);
  const pageData = await loadPharmaciesCatalogPageData(parsedFilters);

  if (hasCatalogSearchParams(resolvedSearchParams)) {
    permanentRedirect(buildPharmacyPath(pageData.filters));
  }

  return <PharmaciesPageContent {...pageData} />;
}

export default PharmaciesPage;
