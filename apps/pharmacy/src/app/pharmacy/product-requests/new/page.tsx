import type { Metadata } from 'next';

import { NewProductRequestPageContent } from '@/components/product-requests/NewProductRequestPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'New product request',
  description: 'Create a new product request draft.',
};

//===================================================================

function NewProductRequestPage() {
  return <NewProductRequestPageContent />;
}

export default NewProductRequestPage;
