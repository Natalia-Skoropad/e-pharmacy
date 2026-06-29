import type { Metadata } from 'next';

import { PharmacyEmptyTablePageContent } from '@/components/shared/PharmacyEmptyTablePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Clients',
  description: 'View pharmacy clients.',
};

//===================================================================

function ClientsPage() {
  return (
    <PharmacyEmptyTablePageContent
      title="Clients"
      description="Client rows are created from real orders for this pharmacy only. New pharmacies do not have clients yet."
      kind="clients"
    />
  );
}

export default ClientsPage;
