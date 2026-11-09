import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOwnProductDetailTab,
  getOwnProductDetailTabPath,
} from '@/lib/products/own-product-detail-tabs';

import {
  isOwnProductsFilterRoute,
  buildOwnProductsPath,
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
} from '@/lib/products/own-product-paths';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnerOwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

export const metadata: Metadata = { title: 'Own product details' };

//===================================================================

export default async function OwnProductDetailTabPage({
  params,
}: Readonly<{ params: Promise<{ productId: string; tab: string }> }>) {
  const { productId, tab } = await params;

  // Next.js can match /[productId]/[tab] before the optional list filters.
  // Preserve existing two-segment filters, pagination and their canonical URL.
  const segments = [productId, tab];

  if (isOwnProductsFilterRoute(segments)) {
    const initialFilters = parseOwnProductsSegments({ filters: segments });

    const initialPagination = parseOwnProductsPaginationSegments({
      filters: segments,
    });

    const canonical = buildOwnProductsPath(initialFilters, initialPagination);

    if (`/pharmacy/products/${segments.join('/')}` !== canonical) {
      redirect(canonical);
    }

    return (
      <OwnerOwnProductsPageContent
        key={JSON.stringify([initialFilters, initialPagination])}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(productId) || !isOwnProductDetailTab(tab)) notFound();
  if (tab === 'details') redirect(getOwnProductDetailTabPath(productId, tab));

  return <OwnProductDetailsPageContent productId={productId} />;
}
