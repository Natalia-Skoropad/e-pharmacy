import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import { parsePharmacyOrderFilters } from '@/lib/pharmacy/routes';

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
    <PharmacyPage
      title="Orders"
      description="Orders table skeleton with clean URL filters. Pagination stays local only."
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
    </PharmacyPage>
  );
}

export default OrdersPage;
