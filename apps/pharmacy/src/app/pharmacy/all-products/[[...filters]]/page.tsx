import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isAllProductsFilterRoute,
  parseAllProductsSegments,
  parseAllProductsPaginationSegments,
  type AllProductsRouteParams,
} from '@/lib/products/all-product-paths';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent/AllProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'All products',
  description: 'View global Admin products available for pharmacy offers.',
};

//===================================================================

type AllProductsPageProps = Readonly<{
  params?: Promise<AllProductsRouteParams>;
}>;

//===================================================================

async function AllProductsPage({ params }: AllProductsPageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.filters;

  if (!isAllProductsFilterRoute(segments)) {
    const productId = segments?.length === 1 ? segments[0] : null;

    if (!productId || !isValidObjectId(productId)) {
      notFound();
    }

    return <AllProductDetailsPageContent productId={productId} />;
  }

  const initialFilters = parseAllProductsSegments(resolvedParams);
  const initialPagination = parseAllProductsPaginationSegments(resolvedParams);

  return (
    <AllProductsPageContent
      key={JSON.stringify([initialFilters, initialPagination])}
      initialFilters={initialFilters}
      initialPagination={initialPagination}
    />
  );
}

export default AllProductsPage;
