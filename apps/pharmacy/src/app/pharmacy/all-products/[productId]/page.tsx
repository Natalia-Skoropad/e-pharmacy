import type { Metadata } from 'next';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent';

import {
  isAllProductsFilterSegment,
  parseAllProductsSegments,
} from '@/lib/products/all-product-paths';

//===================================================================

export const metadata: Metadata = {
  title: 'Global product details',
  description: 'View global product data and add it to the current pharmacy.',
};

//===================================================================

type AllProductDetailsPageProps = Readonly<{
  params: Promise<{ productId: string }>;
}>;

//===================================================================

async function AllProductDetailsPage({ params }: AllProductDetailsPageProps) {
  const { productId } = await params;

  if (isAllProductsFilterSegment(productId)) {
    return (
      <AllProductsPageContent
        initialFilters={parseAllProductsSegments({ filters: [productId] })}
      />
    );
  }

  return <AllProductDetailsPageContent productId={productId} />;
}

export default AllProductDetailsPage;
