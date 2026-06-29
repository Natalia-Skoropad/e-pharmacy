import type { Metadata } from 'next';

import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

//===================================================================

export const metadata: Metadata = {
  title: 'Edit product request',
  description: 'Edit a draft product request.',
};

//===================================================================

type EditProductRequestPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

//===================================================================

async function EditProductRequestPage({ params }: EditProductRequestPageProps) {
  const { requestId } = await params;

  return (
    <LockedPharmacyFeaturePage
      title={`Edit product request ${requestId}`}
      description="Editing product requests is unavailable while the pharmacy has the new status."
      featureName="Product request editing"
    />
  );
}

export default EditProductRequestPage;
