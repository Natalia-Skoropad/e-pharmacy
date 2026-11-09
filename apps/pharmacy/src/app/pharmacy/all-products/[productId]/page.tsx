import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isAllProductsFilterSegment,
  parseAllProductsSegments,
  parseAllProductsPaginationSegments,
} from '@/lib/products/all-product-paths';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent/AllProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Global product details',

  description:
    'View global product data and add it to eligible pharmacies owned by this account.',
};

//===================================================================

type AllProductDetailsPageProps = Readonly<{
  params: Promise<{ productId: string }>;
}>;

//===================================================================

async function AllProductDetailsPage({ params }: AllProductDetailsPageProps) {
  const { productId } = await params;

  if (isAllProductsFilterSegment(productId)) {
    const routeParams = { filters: [productId] };
    const initialFilters = parseAllProductsSegments(routeParams);
    const initialPagination = parseAllProductsPaginationSegments(routeParams);

    return (
      <AllProductsPageContent
        key={JSON.stringify([initialFilters, initialPagination])}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(productId)) {
    notFound();
  }

  return <AllProductDetailsPageContent productId={productId} />;
}

export default AllProductDetailsPage;
