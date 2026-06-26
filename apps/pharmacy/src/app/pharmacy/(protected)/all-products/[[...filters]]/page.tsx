import type { Metadata } from 'next';

import { AllProductsPageContent } from '@/components/all-products/AllProductsPageContent';
import { getAllProductsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

//===================================================================

export const metadata: Metadata = {
  title: 'All products',
  description: 'View global Admin products available for pharmacy offers.',
};

//===================================================================

function AllProductsPage() {
  return <AllProductsPageContent breadcrumbs={getAllProductsBreadcrumbs()} />;
}

export default AllProductsPage;
