import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOrdersFilterSegment,
  parseOrdersSegments,
} from '@/lib/orders/order-paths';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

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

  if (!isValidObjectId(orderId)) {
    notFound();
  }

  return <OrderDetailsPageContent key={orderId} orderId={orderId} />;
}

export default OrderDetailsPage;
