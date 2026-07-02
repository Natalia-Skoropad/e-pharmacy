import type { Metadata } from 'next';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

import {
  isOrdersFilterRoute,
  parseOrdersSegments,
  type OrdersRouteParams,
} from '@/lib/orders/order-paths';

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
    return <OrderDetailsPageContent orderId={segments?.[0] ?? ''} />;
  }

  return <OrdersPageContent initialFilters={parseOrdersSegments(resolvedParams)} />;
}

export default OrdersPage;
