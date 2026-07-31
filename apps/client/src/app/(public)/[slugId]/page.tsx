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

import { buildPharmacyPath, buildProductPath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo/server';

import { DetailsUnavailablePage } from '@/components/common/DetailsUnavailablePage';
import { PharmacyDetailPage } from '@/components/pharmacies/server/PharmacyDetailPage';
import { ProductDetailPage } from '@/components/product-catalog/server/ProductDetailPage';

//===================================================================

type PublicDetailsPageProps = Readonly<{
  params: Promise<{ slugId: string }>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

const resolveProduct = cache(lookupProductBySlugId);
const resolvePharmacy = cache(lookupPharmacyBySlugId);

//===================================================================

function createProductQueryString(pharmacyId?: string): string {
  return pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
}

//===================================================================

export async function generateMetadata({
  params,
}: PublicDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const parsed = parsePublicEntitySlugId(slugId);

  if (!parsed) {
    return createPageMetadata({
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  if (parsed.entityType === 'product') {
    const result = await resolveProduct(slugId);

    if (result.status === 'unavailable') {
      return createPageMetadata({
        title: 'Product temporarily unavailable',
        description: 'The requested product could not be loaded right now.',
        path: `/${slugId}`,
        noIndex: true,
      });
    }

    if (result.status === 'not_found') {
      return createPageMetadata({
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
        path: `/${slugId}`,
        noIndex: true,
      });
    }

    return createProductDetailMetadata(result.product);
  }

  const result = await resolvePharmacy(slugId);

  if (result.status === 'unavailable') {
    return createPageMetadata({
      title: 'Pharmacy temporarily unavailable',
      description: 'The requested pharmacy could not be loaded right now.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  if (result.status === 'not_found') {
    return createPageMetadata({
      title: 'Pharmacy Not Found',
      description: 'The requested pharmacy could not be found.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  return createPharmacyDetailMetadata(result.pharmacy);
}

//===================================================================

async function PublicDetailsPage({
  params,
  searchParams,
}: PublicDetailsPageProps) {
  const { slugId } = await params;
  const parsed = parsePublicEntitySlugId(slugId);
  if (!parsed) notFound();

  if (parsed.entityType === 'product') {
    const result = await resolveProduct(slugId);

    if (result.status === 'unavailable') {
      return (
        <DetailsUnavailablePage entityLabel="product" error={result} />
      );
    }

    if (result.status === 'not_found') notFound();

    const resolvedSearchParams = await searchParams;
    const canonicalPath = buildProductPath(
      result.product.name,
      result.product.id,
      result.product.publicSlugId
    );

    if (canonicalPath !== `/${slugId}`) {
      permanentRedirect(
        `${canonicalPath}${createProductQueryString(resolvedSearchParams?.pharmacyId)}`
      );
    }

    return (
      <ProductDetailPage
        product={result.product}
        pharmacyId={resolvedSearchParams?.pharmacyId}
      />
    );
  }

  const result = await resolvePharmacy(slugId);

  if (result.status === 'unavailable') {
    return (
      <DetailsUnavailablePage entityLabel="pharmacy" error={result} />
    );
  }

  if (result.status === 'not_found') notFound();

  const canonicalPath = buildPharmacyPath(
    result.pharmacy.name,
    result.pharmacy.id,
    result.pharmacy.publicSlugId
  );

  if (canonicalPath !== `/${slugId}`) {
    permanentRedirect(canonicalPath);
  }

  return <PharmacyDetailPage pharmacy={result.pharmacy} />;
}

export default PublicDetailsPage;
