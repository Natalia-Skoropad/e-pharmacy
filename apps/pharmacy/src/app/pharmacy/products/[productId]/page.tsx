import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOwnProductsFilterSegment,
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
} from '@/lib/products/own-product-paths';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnerOwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product details',
  description: 'View own product details and pharmacy-specific offer data.',
};

//===================================================================

type ProductDetailsPageProps = Readonly<{
  params: Promise<{ productId: string }>;
}>;

//===================================================================

async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = await params;

  if (isOwnProductsFilterSegment(productId)) {
    const params = { filters: [productId] };
    const initialFilters = parseOwnProductsSegments(params);
    const initialPagination = parseOwnProductsPaginationSegments(params);

    return (
      <OwnerOwnProductsPageContent
        key={JSON.stringify({ initialFilters, initialPagination })}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(productId)) {
    notFound();
  }

  return <OwnProductDetailsPageContent productId={productId} />;
}

export default ProductDetailsPage;
