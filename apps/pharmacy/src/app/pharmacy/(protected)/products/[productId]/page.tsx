import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

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
    <PharmacyPage
      title={`Product ${productId}`}
      description="Product details skeleton with global product data and pharmacy-specific price and stock."
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
    </PharmacyPage>
  );
}

export default ProductDetailsPage;
