import type { Metadata } from 'next';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { getNewProductRequestBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

//===================================================================

export const metadata: Metadata = {
  title: 'New product request',
  description: 'Create a new product request draft.',
};

//===================================================================

function NewProductRequestPage() {
  return (
    <CabinetPage
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
    </CabinetPage>
  );
}

export default NewProductRequestPage;
