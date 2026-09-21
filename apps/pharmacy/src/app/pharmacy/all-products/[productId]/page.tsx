import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isAllProductsFilterSegment,
  parseAllProductsSegments,
} from '@/lib/products/all-product-paths';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent/AllProductsPageContent';

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
    const initialFilters = parseAllProductsSegments({ filters: [productId] });

    return (
      <AllProductsPageContent
        key={JSON.stringify(initialFilters)}
        initialFilters={initialFilters}
      />
    );
  }

  if (!isValidObjectId(productId)) {
    notFound();
  }

  return <AllProductDetailsPageContent productId={productId} mode="all" />;
}

export default AllProductDetailsPage;
