import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isProductRequestsFilterRoute,
  parseProductRequestsSegments,
  type ProductRequestsRouteParams,
} from '@/lib/product-requests/product-request-paths';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';
import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';

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
    const requestId = segments?.length === 1 ? segments[0] : null;

    if (!requestId || !isValidObjectId(requestId)) {
      notFound();
    }

    return <ProductRequestDetailsPageContent requestId={requestId} />;
  }

  const initialFilters = parseProductRequestsSegments(resolvedParams);

  return (
    <ProductRequestsPageContent
      key={JSON.stringify(initialFilters)}
      initialFilters={initialFilters}
    />
  );
}

export default ProductRequestsPage;
