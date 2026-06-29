import type { Metadata } from 'next';

import { PharmacyEmptyTablePageContent } from '@/components/shared/PharmacyEmptyTablePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product requests',
  description: 'View pharmacy product creation requests.',
};

//===================================================================

function ProductRequestsPage() {
  return (
    <PharmacyEmptyTablePageContent
      title="Product requests"
      description="Product requests are available after verification. A new pharmacy can review the empty request table but cannot create requests yet."
      kind="product-requests"
    />
  );
}

export default ProductRequestsPage;
