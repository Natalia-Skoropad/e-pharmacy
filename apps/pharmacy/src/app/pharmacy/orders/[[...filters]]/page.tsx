import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOrdersFilterRoute,
  parseOrdersSegments,
  type OrdersRouteParams,
} from '@/lib/orders/order-paths';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and process pharmacy orders.',
};

//===================================================================

type OrdersPageProps = Readonly<{
  params?: Promise<OrdersRouteParams>;
}>;

//===================================================================

async function OrdersPage({ params }: OrdersPageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.filters;

  if (!isOrdersFilterRoute(segments)) {
    const orderId = segments?.length === 1 ? segments[0] : null;

    if (!orderId || !isValidObjectId(orderId)) {
      notFound();
    }

    return <OrderDetailsPageContent key={orderId} orderId={orderId} />;
  }

  return (
    <OrdersPageContent initialFilters={parseOrdersSegments(resolvedParams)} />
  );
}

export default OrdersPage;
