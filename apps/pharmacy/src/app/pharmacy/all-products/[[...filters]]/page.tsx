import type { Metadata } from 'next';

import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'All products',
  description: 'View global Admin products available for pharmacy offers.',
};

//===================================================================

function AllProductsPage() {
  return <AllProductsPageContent />;
}

export default AllProductsPage;
