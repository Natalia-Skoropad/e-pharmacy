import type { Metadata } from 'next';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

import {
  isOrdersFilterSegment,
  parseOrdersSegments,
} from '@/lib/orders/order-paths';

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

  if (isOrdersFilterSegment(orderId)) {
    return (
      <OrdersPageContent
        initialFilters={parseOrdersSegments({ filters: [orderId] })}
      />
    );
  }

  return <OrderDetailsPageContent orderId={orderId} />;
}

export default OrderDetailsPage;
