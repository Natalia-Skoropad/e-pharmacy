import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOrdersFilterRoute,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
  buildOrdersPath,
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
  searchParams?: Promise<{ pharmacyId?: string | string[] }>;
}>;

//===================================================================

async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.filters;

  if (!isOrdersFilterRoute(segments)) {
    const orderId = segments?.length === 1 ? segments[0] : null;

    if (!orderId || !isValidObjectId(orderId)) {
      notFound();
    }

    return <OrderDetailsPageContent key={orderId} orderId={orderId} />;
  }

  const filters = parseOrdersSegments(resolvedParams);
  const pagination = parseOrdersPaginationSegments(resolvedParams);
  const query = await searchParams;

  // Upgrade legacy links; the owner registry never keeps pharmacyId in query strings.
  if (
    typeof query?.pharmacyId === 'string' &&
    /^[0-9a-f]{24}$/i.test(query.pharmacyId)
  ) {
    redirect(
      buildOrdersPath(
        { ...filters, pharmacyId: query.pharmacyId.toLowerCase() },
        pagination
      )
    );
  }

  return (
    <OrdersPageContent
      initialFilters={filters}
      initialPagination={pagination}
    />
  );
}

export default OrdersPage;
