import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isAllProductDetailTab,
  getAllProductDetailTabPath,
} from '@/lib/products/all-product-detail-tabs';

import {
  isAllProductsFilterRoute,
  buildAllProductsPath,
  parseAllProductsSegments,
  parseAllProductsPaginationSegments,
} from '@/lib/products/all-product-paths';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent/AllProductsPageContent';

//===================================================================

export const metadata: Metadata = { title: 'Global product details' };

//===================================================================

export default async function AllProductDetailTabPage({
  params,
}: Readonly<{ params: Promise<{ productId: string; tab: string }> }>) {
  const { productId, tab } = await params;

  // Next.js selects /[productId]/[tab] ahead of the optional catalog
  // catch-all even for two filter segments. Preserve canonical filter URLs.
  const segments = [productId, tab];

  if (isAllProductsFilterRoute(segments)) {
    const initialFilters = parseAllProductsSegments({ filters: segments });

    const initialPagination = parseAllProductsPaginationSegments({
      filters: segments,
    });

    const canonical = buildAllProductsPath(initialFilters, initialPagination);

    if (`/pharmacy/all-products/${segments.join('/')}` !== canonical) {
      redirect(canonical);
    }

    return (
      <AllProductsPageContent
        key={JSON.stringify([initialFilters, initialPagination])}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(productId) || !isAllProductDetailTab(tab)) notFound();
  if (tab === 'details') redirect(getAllProductDetailTabPath(productId, tab));

  return <AllProductDetailsPageContent productId={productId} mode="all" />;
}
