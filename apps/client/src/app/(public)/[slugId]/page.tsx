import { notFound, permanentRedirect } from 'next/navigation';

import {
  createProductDetailMetadata,
  createPharmacyDetailMetadata,
  resolveRootDetailBySlugId,
} from '@/lib/details';

import { createPageMetadata } from '@/lib/seo/server';
import { ProductDetailPage } from '@/components/product-catalog/server/ProductDetailPage';
import { PharmacyDetailPage } from '@/components/pharmacies/server/PharmacyDetailPage';

import RootDetailsUnavailablePage from './RootDetailsUnavailablePage';

import type { Metadata } from 'next';

//===================================================================

type RootDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
  searchParams?: Promise<{
    pharmacyId?: string;
  }>;
};

//===================================================================

function createProductCanonicalQueryString(pharmacyId?: string): string {
  return pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
}

//===================================================================

export async function generateMetadata({
  params,
}: RootDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const result = await resolveRootDetailBySlugId(slugId);

  if (result.status === 'unavailable') {
    return createPageMetadata({
      title: 'Service temporarily unavailable',
      description:
        'The requested product or pharmacy could not be loaded right now.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  if (result.status === 'not_found') {
    return createPageMetadata({
      title: 'Page Not Found',
      description: 'The requested product or pharmacy could not be found.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  if (result.detail.type === 'product') {
    return createProductDetailMetadata(result.detail.product);
  }

  return createPharmacyDetailMetadata(result.detail.pharmacy);
}

//===================================================================

async function RootDetailsPage({ params, searchParams }: RootDetailsPageProps) {
  const { slugId } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await resolveRootDetailBySlugId(slugId);

  if (result.status === 'unavailable') {
    return <RootDetailsUnavailablePage reason={result.reason} />;
  }

  if (result.status === 'not_found') notFound();

  const { detail } = result;

  if (!detail.isCanonicalSlug) {
    const queryString =
      detail.type === 'product'
        ? createProductCanonicalQueryString(resolvedSearchParams?.pharmacyId)
        : '';

    permanentRedirect(`${detail.canonicalPath}${queryString}`);
  }

  if (detail.type === 'product') {
    return (
      <ProductDetailPage
        product={detail.product}
        pharmacyId={resolvedSearchParams?.pharmacyId}
      />
    );
  }

  return <PharmacyDetailPage pharmacy={detail.pharmacy} />;
}

export default RootDetailsPage;
