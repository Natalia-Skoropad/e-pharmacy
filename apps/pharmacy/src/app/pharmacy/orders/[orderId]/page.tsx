import type { Metadata } from 'next';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';

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

  return <OrderDetailsPageContent orderId={orderId} />;
}

export default OrderDetailsPage;
