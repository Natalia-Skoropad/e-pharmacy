import type { Metadata } from 'next';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';
import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';

import {
  isProductRequestsFilterSegment,
  parseProductRequestsSegments,
} from '@/lib/product-requests/product-request-paths';

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
    return (
      <ProductRequestsPageContent
        initialFilters={parseProductRequestsSegments({ filters: [requestId] })}
      />
    );
  }

  return <ProductRequestDetailsPageContent requestId={requestId} />;
}

export default ProductRequestDetailsPage;
