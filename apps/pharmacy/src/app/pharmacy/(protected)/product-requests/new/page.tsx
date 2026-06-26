import type { Metadata } from 'next';

import { getNewProductRequestBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

//===================================================================

export const metadata: Metadata = {
  title: 'New product request',
  description: 'Create a new product request draft.',
};

//===================================================================

function NewProductRequestPage() {
  return (
    <LockedPharmacyFeaturePage
      title="New product request"
      description="Creating product requests is locked while the pharmacy has the new status."
      breadcrumbs={getNewProductRequestBreadcrumbs()}
      featureName="Product request creation"
    />
  );
}

export default NewProductRequestPage;
