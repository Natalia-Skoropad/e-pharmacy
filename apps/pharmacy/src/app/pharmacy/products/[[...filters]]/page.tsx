import type { Metadata } from 'next';

import { OwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Own products',
  description: 'View products added to the current pharmacy.',
};

//===================================================================

function ProductsPage() {
  return <OwnProductsPageContent />;
}

export default ProductsPage;
