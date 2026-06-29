import type { Metadata } from 'next';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';

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

  return <ProductRequestDetailsPageContent requestId={requestId} />;
}

export default ProductRequestDetailsPage;
