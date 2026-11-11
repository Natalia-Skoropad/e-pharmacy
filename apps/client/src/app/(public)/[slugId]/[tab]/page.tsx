import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { parsePublicEntitySlugId } from '@e-pharmacy/validation/url';

import {
  createPharmacyDetailMetadata,
  createProductDetailMetadata,
  lookupPharmacyBySlugId,
  lookupProductBySlugId,
} from '@/lib/details';

import {
  buildPharmacyPath,
  buildProductPath,
  buildProductContextQueryString,
} from '@/lib/routes';

import { getProductTabFromSegment } from '@/lib/routes/product-detail-tabs';

import { DetailsUnavailablePage } from '@/components/common/DetailsUnavailablePage';
import type { PharmacyTab } from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsTabs';
import { PharmacyDetailPage } from '@/components/pharmacies/server/PharmacyDetailPage';
import { ProductDetailPage } from '@/components/product-catalog/server/ProductDetailPage';

//===================================================================

const resolvePharmacy = cache(lookupPharmacyBySlugId);
const resolveProduct = cache(lookupProductBySlugId);

//===================================================================

const pharmacyTabs: Readonly<Record<string, PharmacyTab>> = {
  about: 'about',
  reviews: 'reviews',
  'bank-details': 'payment',
};

//===================================================================

type Props = Readonly<{
  params: Promise<{ slugId: string; tab: string }>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId, tab } = await params;
  const parsed = parsePublicEntitySlugId(slugId);

  if (parsed?.entityType === 'product' && getProductTabFromSegment(tab)) {
    const result = await resolveProduct(slugId);

    return result.status === 'found'
      ? createProductDetailMetadata(result.product)
      : {};
  }

  if (parsed?.entityType === 'pharmacy' && pharmacyTabs[tab]) {
    const result = await resolvePharmacy(slugId);

    return result.status === 'found'
      ? createPharmacyDetailMetadata(result.pharmacy, pharmacyTabs[tab])
      : pharmacyTabs[tab] === 'payment'
        ? { robots: { index: false, follow: false, nocache: true } }
        : {};
  }

  return {};
}

//===================================================================

export default async function PublicDetailTabPage({
  params,
  searchParams,
}: Props) {
  const { slugId, tab } = await params;
  const parsed = parsePublicEntitySlugId(slugId);

  if (parsed?.entityType === 'product') {
    const activeProductTab = getProductTabFromSegment(tab);

    if (!activeProductTab) notFound();

    const result = await resolveProduct(slugId);

    if (result.status === 'unavailable') {
      return <DetailsUnavailablePage entityLabel="product" error={result} />;
    }

    if (result.status === 'not_found') notFound();

    const canonical = buildProductPath(
      result.product.name,
      result.product.id,
      result.product.publicSlugId
    );

    const resolvedSearchParams = await searchParams;

    if (canonical !== `/${slugId}`) {
      permanentRedirect(
        `${canonical}/${tab}${buildProductContextQueryString(resolvedSearchParams?.pharmacyId)}`
      );
    }

    return (
      <ProductDetailPage
        product={result.product}
        pharmacyId={resolvedSearchParams?.pharmacyId}
        initialTab={activeProductTab}
      />
    );
  }

  if (parsed?.entityType !== 'pharmacy') notFound();

  const activeTab = pharmacyTabs[tab];

  if (!activeTab) notFound();

  const result = await resolvePharmacy(slugId);

  if (result.status === 'unavailable') {
    return <DetailsUnavailablePage entityLabel="pharmacy" error={result} />;
  }

  if (result.status === 'not_found') notFound();

  const canonical = buildPharmacyPath(
    result.pharmacy.name,
    result.pharmacy.id,
    result.pharmacy.publicSlugId
  );

  if (canonical !== `/${slugId}`) {
    permanentRedirect(`${canonical}/${tab}`);
  }

  return (
    <PharmacyDetailPage pharmacy={result.pharmacy} initialTab={activeTab} />
  );
}
