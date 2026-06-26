import type { Metadata } from 'next';

import { getOrdersBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { parsePharmacyOrderFilters } from '@/lib/pharmacy/routes';

import { PlaceholderCards } from '@e-pharmacy/ui/common';
import { CabinetPage } from '@e-pharmacy/ui/common';

//===================================================================

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and process pharmacy orders.',
};

//===================================================================

type OrdersPageProps = Readonly<{
  params: Promise<{ filters?: string[] }>;
}>;

//===================================================================

async function OrdersPage({ params }: OrdersPageProps) {
  const { filters } = await params;
  const parsedFilters = parsePharmacyOrderFilters(filters);

  return (
    <CabinetPage
      title="Orders"
      description="Orders table skeleton with clean URL filters. Pagination stays local only."
      breadcrumbs={getOrdersBreadcrumbs()}
    >
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards
        items={[
          'Order number',
          'Created date',
          'Client',
          'Total items',
          'Total price',
          'Payment method',
          'Delivery method',
          'Status',
        ]}
      />
    </CabinetPage>
  );
}

export default OrdersPage;
