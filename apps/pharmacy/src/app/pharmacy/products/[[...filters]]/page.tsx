import type { Metadata } from 'next';

import { PharmacyEmptyTablePageContent } from '@/components/shared/PharmacyEmptyTablePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Own products',
  description: 'View products added to the current pharmacy.',
};

//===================================================================

function ProductsPage() {
  return (
    <PharmacyEmptyTablePageContent
      title="Own products"
      description="Own products will appear only after verification, when adding products to this pharmacy becomes available."
      kind="products"
    />
  );
}

export default ProductsPage;
