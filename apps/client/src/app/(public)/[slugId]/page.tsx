import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import {
  getIdFromSlugId,
  parsePublicEntitySlugId,
} from '@e-pharmacy/validation/url';

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

async function resolveLegacyPublicEntity(slugId: string) {
  if (!getIdFromSlugId(slugId)) return null;

  const productResult = await resolveProduct(slugId);

  if (productResult.status === 'found') {
    return { entityType: 'product' as const, result: productResult };
  }

  const pharmacyResult = await resolvePharmacy(slugId);

  if (pharmacyResult.status === 'found') {
    return { entityType: 'pharmacy' as const, result: pharmacyResult };
  }

  if (
    productResult.status === 'unavailable' ||
    pharmacyResult.status === 'unavailable'
  ) {
    return {
      entityType: 'unavailable' as const,
      result:
        productResult.status === 'unavailable'
          ? productResult
          : pharmacyResult.status === 'unavailable'
            ? pharmacyResult
            : null,
    };
  }

  return null;
}

//===================================================================

export async function generateMetadata({
  params,
}: PublicDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const parsed = parsePublicEntitySlugId(slugId);

  if (!parsed) {
    const legacyEntity = await resolveLegacyPublicEntity(slugId);

    if (legacyEntity?.entityType === 'product') {
      return createProductDetailMetadata(legacyEntity.result.product);
    }

    if (legacyEntity?.entityType === 'pharmacy') {
      return createPharmacyDetailMetadata(legacyEntity.result.pharmacy);
    }

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
  const resolvedSearchParams = await searchParams;

  if (!parsed) {
    const legacyEntity = await resolveLegacyPublicEntity(slugId);

    if (legacyEntity?.entityType === 'product') {
      const canonicalPath = buildProductPath(
        legacyEntity.result.product.name,
        legacyEntity.result.product.id,
        legacyEntity.result.product.publicSlugId
      );

      permanentRedirect(
        `${canonicalPath}${createProductQueryString(resolvedSearchParams?.pharmacyId)}`
      );
    }

    if (legacyEntity?.entityType === 'pharmacy') {
      permanentRedirect(
        buildPharmacyPath(
          legacyEntity.result.pharmacy.name,
          legacyEntity.result.pharmacy.id,
          legacyEntity.result.pharmacy.publicSlugId
        )
      );
    }

    if (legacyEntity?.entityType === 'unavailable' && legacyEntity.result) {
      return (
        <DetailsUnavailablePage entityLabel="page" error={legacyEntity.result} />
      );
    }

    return notFound();
  }

  if (parsed.entityType === 'product') {
    const result = await resolveProduct(slugId);

    if (result.status === 'unavailable') {
      return (
        <DetailsUnavailablePage entityLabel="product" error={result} />
      );
    }

    if (result.status === 'not_found') notFound();

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
