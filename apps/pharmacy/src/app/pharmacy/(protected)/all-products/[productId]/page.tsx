import type { Metadata } from 'next';

import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent';
import { getAllProductDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

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
    <AllProductDetailsPageContent
      productId={productId}
      breadcrumbs={getAllProductDetailsBreadcrumbs(productId)}
    />
  );
}

export default AllProductDetailsPage;
