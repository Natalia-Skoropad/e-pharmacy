import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOrdersFilterSegment,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
} from '@/lib/orders/order-paths';

import { getPharmacyOrderPath } from '@/lib/routes';

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
        initialPagination={parseOrdersPaginationSegments({
          filters: [orderId],
        })}
      />
    );
  }

  if (!isValidObjectId(orderId)) {
    notFound();
  }

  redirect(getPharmacyOrderPath(orderId));
}

export default OrderDetailsPage;
