import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { getNewProductRequestBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

//===================================================================

export const metadata: Metadata = {
  title: 'New product request',
  description: 'Create a new product request draft.',
};

//===================================================================

function NewProductRequestPage() {
  return (
    <PharmacyPage
      title="New product request"
      description="Create product request form skeleton with draft and send-for-moderation actions."
      breadcrumbs={getNewProductRequestBreadcrumbs()}
    >
      <PlaceholderCards
        items={[
          'Product image',
          'Required draft fields',
          'Required moderation fields',
          'Characteristics',
          'Additional files',
          'Save draft action',
          'Send for moderation action',
        ]}
      />
    </PharmacyPage>
  );
}

export default NewProductRequestPage;
