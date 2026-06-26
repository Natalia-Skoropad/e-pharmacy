import type { Metadata } from 'next';

import { getProductDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

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
    <CabinetPage
      title={`Product ${productId}`}
      description="Product details skeleton with global product data and pharmacy-specific price and stock."
      breadcrumbs={getProductDetailsBreadcrumbs(productId)}
    >
      <PlaceholderCards
        items={[
          'Product overview',
          'Pharmacy offer',
          'Statistics tab',
          'Stock movement tab',
          'Related orders tab',
          'Characteristics tab',
          'Reviews tab',
        ]}
      />
    </CabinetPage>
  );
}

export default ProductDetailsPage;
