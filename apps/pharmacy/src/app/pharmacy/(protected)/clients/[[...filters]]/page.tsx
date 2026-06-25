import type { Metadata } from 'next';

import { getClientsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { parsePharmacyClientFilters } from '@/lib/pharmacy/routes';

import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';

//===================================================================

export const metadata: Metadata = {
  title: 'Clients',
  description: 'View pharmacy clients.',
};

//===================================================================

type ClientsPageProps = Readonly<{
  params: Promise<{ filters?: string[] }>;
}>;

//===================================================================

async function ClientsPage({ params }: ClientsPageProps) {
  const { filters } = await params;
  const parsedFilters = parsePharmacyClientFilters(filters);

  return (
    <PharmacyPage
      title="Clients"
      description="Clients table skeleton with status, date, and search clean URL filters."
      breadcrumbs={getClientsBreadcrumbs()}
    >
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards
        items={[
          'Client name',
          'Email',
          'Phone',
          'First order date',
          'Orders count',
          'Total spent',
          'Status',
        ]}
      />
    </PharmacyPage>
  );
}

export default ClientsPage;
