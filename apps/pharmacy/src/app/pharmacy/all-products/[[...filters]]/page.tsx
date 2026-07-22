import type { Metadata } from 'next';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent';
import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent';

import {
  isAllProductsFilterRoute,
  parseAllProductsSegments,
  type AllProductsRouteParams,
} from '@/lib/products/all-product-paths';

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
    return <AllProductDetailsPageContent productId={segments?.[0] ?? ''} />;
  }

  return (
    <AllProductsPageContent
      initialFilters={parseAllProductsSegments(resolvedParams)}
    />
  );
}

export default AllProductsPage;
