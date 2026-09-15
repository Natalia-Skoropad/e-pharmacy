import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  parseClientsSegments,
  resolveClientsRoute,
  type ClientsRouteParams,
} from '@/lib/clients/client-paths';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Clients',
  description: 'View pharmacy clients.',
};

//===================================================================

type ClientsPageProps = Readonly<{
  params?: Promise<ClientsRouteParams>;
}>;

//===================================================================

async function ClientsPage({ params }: ClientsPageProps) {
  const resolvedParams = await params;
  const route = resolveClientsRoute(resolvedParams?.filters);

  if (route.kind === 'invalid') {
    notFound();
  }

  if (route.kind === 'detail') {
    return <ClientDetailsPageContent clientId={route.clientId} />;
  }

  return (
    <ClientsPageContent
      initialFilters={parseClientsSegments({ filters: route.filters })}
    />
  );
}

export default ClientsPage;
