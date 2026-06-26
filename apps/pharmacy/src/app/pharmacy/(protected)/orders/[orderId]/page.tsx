import type { Metadata } from 'next';

import { getOrderDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

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
    <CabinetPage
      title={`Order #${orderId}`}
      description="Order details skeleton with client, delivery, payment, items, status history, and actions."
      breadcrumbs={getOrderDetailsBreadcrumbs(orderId)}
    >
      <PlaceholderCards
        items={[
          'Client info',
          'Delivery info',
          'Payment info',
          'Order items',
          'Status history',
          'Action buttons',
        ]}
      />
    </CabinetPage>
  );
}

export default OrderDetailsPage;
