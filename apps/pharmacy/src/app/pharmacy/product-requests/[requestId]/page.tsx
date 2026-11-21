import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isProductRequestsFilterSegment,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
} from '@/lib/product-requests/product-request-paths';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';
import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product request details',
  description: 'View product request status and moderation details.',
};

//===================================================================

type ProductRequestDetailsPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

//===================================================================

async function ProductRequestDetailsPage({
  params,
}: ProductRequestDetailsPageProps) {
  const { requestId } = await params;

  if (isProductRequestsFilterSegment(requestId)) {
    const params = { filters: [requestId] };
    const initialFilters = parseProductRequestsSegments(params);
    const initialPagination = parseProductRequestsPaginationSegments(params);

    return (
      <ProductRequestsPageContent
        key={JSON.stringify([initialFilters, initialPagination])}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(requestId)) {
    notFound();
  }

  return <ProductRequestDetailsPageContent requestId={requestId} />;
}

export default ProductRequestDetailsPage;
