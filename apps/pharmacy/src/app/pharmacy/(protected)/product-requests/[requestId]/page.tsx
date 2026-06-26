import type { Metadata } from 'next';

import { getProductRequestDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

//===================================================================

export const metadata: Metadata = {
  title: 'Product request details',
  description: 'View product request status and moderation details.',
};

//===================================================================

type ProductRequestDetailsPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

//===================================================================

async function ProductRequestDetailsPage({
  params,
}: ProductRequestDetailsPageProps) {
  const { requestId } = await params;

  return (
    <LockedPharmacyFeaturePage
      title={`Product request ${requestId}`}
      description="Product request details are unavailable until request creation is unlocked after verification."
      breadcrumbs={getProductRequestDetailsBreadcrumbs(requestId)}
      featureName="Product request details"
    />
  );
}

export default ProductRequestDetailsPage;
