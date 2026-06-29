import type { Metadata } from 'next';

import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

//===================================================================

export const metadata: Metadata = {
  title: 'Order details',
  description: 'View and update an order.',
};

//===================================================================

type OrderDetailsPageProps = Readonly<{
  params: Promise<{ orderId: string }>;
}>;

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  return (
    <LockedPharmacyFeaturePage
      title={`Order #${orderId}`}
      description="Order details are unavailable for a newly registered pharmacy because no real orders can exist before verification."
      featureName="Order details"
    />
  );
}

export default OrderDetailsPage;
