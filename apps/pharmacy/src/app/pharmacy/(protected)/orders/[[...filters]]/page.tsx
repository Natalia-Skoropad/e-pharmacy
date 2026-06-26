import type { Metadata } from 'next';

import { getOrdersBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { PharmacyEmptyTablePageContent } from '@/components/shared/PharmacyEmptyTablePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and process pharmacy orders.',
};

//===================================================================

function OrdersPage() {
  return (
    <PharmacyEmptyTablePageContent
      title="Orders"
      description="Orders will contain only real client orders for the current pharmacy. A newly registered pharmacy starts with an empty table."
      breadcrumbs={getOrdersBreadcrumbs()}
      kind="orders"
    />
  );
}

export default OrdersPage;
