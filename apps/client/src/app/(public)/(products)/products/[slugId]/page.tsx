import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import {
  createProductDetailMetadata,
  lookupProductBySlugId,
} from '@/lib/details';

import { buildProductPath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo/server';

import { DetailsUnavailablePage } from '@/components/common/DetailsUnavailablePage';

//===================================================================

type LegacyProductDetailsPageProps = Readonly<{
  params: Promise<{ slugId: string }>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

const resolveProduct = cache(lookupProductBySlugId);

//===================================================================

function createProductQueryString(pharmacyId?: string): string {
  return pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
}

//===================================================================

export async function generateMetadata({
  params,
}: LegacyProductDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const result = await resolveProduct(slugId);

  if (result.status !== 'found') {
    return createPageMetadata({
      title:
        result.status === 'not_found'
          ? 'Product Not Found'
          : 'Product temporarily unavailable',

      description: 'The requested product could not be loaded.',
      path: `/products/${slugId}`,
      noIndex: true,
    });
  }

  return createProductDetailMetadata(result.product);
}

//===================================================================

async function LegacyProductDetailsPage({
  params,
  searchParams,
}: LegacyProductDetailsPageProps) {
  const { slugId } = await params;
  const result = await resolveProduct(slugId);

  if (result.status === 'not_found') notFound();
  if (result.status === 'unavailable') {
    return (
      <DetailsUnavailablePage entityLabel="product" error={result} />
    );
  }

  const resolvedSearchParams = await searchParams;

  permanentRedirect(
    `${buildProductPath(
      result.product.name,
      result.product.id,
      result.product.publicSlugId
    )}${createProductQueryString(resolvedSearchParams?.pharmacyId)}`
  );
}

export default LegacyProductDetailsPage;
