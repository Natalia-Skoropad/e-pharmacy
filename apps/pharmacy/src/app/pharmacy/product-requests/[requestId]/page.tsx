import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isProductRequestsFilterSegment,
  parseProductRequestsSegments,
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
    const initialFilters = parseProductRequestsSegments({
      filters: [requestId],
    });

    return (
      <ProductRequestsPageContent
        key={JSON.stringify(initialFilters)}
        initialFilters={initialFilters}
      />
    );
  }

  if (!isValidObjectId(requestId)) {
    notFound();
  }

  return <ProductRequestDetailsPageContent requestId={requestId} />;
}

export default ProductRequestDetailsPage;
