import type { Metadata } from 'next';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';
import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';

import {
  isProductRequestsFilterRoute,
  parseProductRequestsSegments,
  type ProductRequestsRouteParams,
} from '@/lib/product-requests/product-request-paths';

//===================================================================

export const metadata: Metadata = {
  title: 'Product requests',
  description: 'View pharmacy product creation requests.',
};

//===================================================================

type ProductRequestsPageProps = Readonly<{
  params?: Promise<ProductRequestsRouteParams>;
}>;

//===================================================================

async function ProductRequestsPage({ params }: ProductRequestsPageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.filters;

  if (!isProductRequestsFilterRoute(segments)) {
    return <ProductRequestDetailsPageContent requestId={segments?.[0] ?? ''} />;
  }

  return (
    <ProductRequestsPageContent
      initialFilters={parseProductRequestsSegments(resolvedParams)}
    />
  );
}

export default ProductRequestsPage;
