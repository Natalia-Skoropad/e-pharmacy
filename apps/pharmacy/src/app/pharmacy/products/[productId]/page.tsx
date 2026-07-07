import type { Metadata } from 'next';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

import {
  isOwnProductsFilterSegment,
  parseOwnProductsSegments,
} from '@/lib/products/own-product-paths';

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
    const initialFilters = parseOwnProductsSegments({ filters: [productId] });

    return (
      <OwnProductsPageContent
        key={JSON.stringify(initialFilters)}
        initialFilters={initialFilters}
      />
    );
  }

  return <OwnProductDetailsPageContent productId={productId} />;
}

export default ProductDetailsPage;
