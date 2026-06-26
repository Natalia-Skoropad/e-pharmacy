import type { Metadata } from 'next';

import { getProductDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

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

  return (
    <LockedPharmacyFeaturePage
      title={`Own product ${productId}`}
      description="Own product details open after verification, when this pharmacy can add products and manage price or stock."
      breadcrumbs={getProductDetailsBreadcrumbs(productId)}
      featureName="Own product details"
    />
  );
}

export default ProductDetailsPage;
