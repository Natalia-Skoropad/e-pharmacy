import type { Metadata } from 'next';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';

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

  return <OwnProductDetailsPageContent productId={productId} />;
}

export default ProductDetailsPage;
