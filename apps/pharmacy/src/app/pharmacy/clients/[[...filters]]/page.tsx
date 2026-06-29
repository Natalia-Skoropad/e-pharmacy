import type { Metadata } from 'next';

import { ClientsPageContent } from '@/components/clients/ClientsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Clients',
  description: 'View pharmacy clients.',
};

//===================================================================

function ClientsPage() {
  return <ClientsPageContent />;
}

export default ClientsPage;
