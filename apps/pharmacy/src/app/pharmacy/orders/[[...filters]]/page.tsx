import type { Metadata } from 'next';

import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and process pharmacy orders.',
};

//===================================================================

function OrdersPage() {
  return <OrdersPageContent />;
}

export default OrdersPage;
