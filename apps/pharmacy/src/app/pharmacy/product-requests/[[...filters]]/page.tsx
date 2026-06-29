import type { Metadata } from 'next';

import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product requests',
  description: 'View pharmacy product creation requests.',
};

//===================================================================

function ProductRequestsPage() {
  return <ProductRequestsPageContent />;
}

export default ProductRequestsPage;
