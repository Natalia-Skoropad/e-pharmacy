import type { Metadata } from 'next';

import { getAllProductDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

//===================================================================

export const metadata: Metadata = {
  title: 'Global product details',
  description: 'View global product data and add it to the current pharmacy.',
};

//===================================================================

type AllProductDetailsPageProps = Readonly<{
  params: Promise<{ productId: string }>;
}>;

//===================================================================

async function AllProductDetailsPage({ params }: AllProductDetailsPageProps) {
  const { productId } = await params;

  return (
    <PharmacyPage
      title={`Global product ${productId}`}
      description="Global product details skeleton with CTA to add the product to the current pharmacy."
      breadcrumbs={getAllProductDetailsBreadcrumbs(productId)}
    >
      <PlaceholderCards
        items={[
          'Global product overview',
          'Add to my pharmacy CTA',
          'Characteristics tab',
          'Reviews tab',
        ]}
      />
    </PharmacyPage>
  );
}

export default AllProductDetailsPage;
