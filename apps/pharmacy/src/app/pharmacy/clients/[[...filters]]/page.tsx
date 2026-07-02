import type { Metadata } from 'next';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';

import {
  isClientsFilterRoute,
  parseClientsSegments,
  type ClientsRouteParams,
} from '@/lib/clients/client-paths';

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
  const segments = resolvedParams?.filters;

  if (!isClientsFilterRoute(segments)) {
    return <ClientDetailsPageContent clientId={segments?.[0] ?? ''} />;
  }

  return (
    <ClientsPageContent initialFilters={parseClientsSegments(resolvedParams)} />
  );
}

export default ClientsPage;
