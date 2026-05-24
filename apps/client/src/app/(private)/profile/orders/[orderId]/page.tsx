import { ProtectedRoute } from '@/routes';
import { OrderDetailsPageContent } from '@/components/orders';

import { createPageMetadata } from '@/lib/seo';

//===================================================================

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export const metadata = createPageMetadata({
  title: 'Order details',
  description: 'Private E-PHARMACY order details.',
  path: '/profile/orders',
  noIndex: true,
});

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  return (
    <ProtectedRoute>
      <OrderDetailsPageContent orderId={orderId} />
    </ProtectedRoute>
  );
}

export default OrderDetailsPage;
