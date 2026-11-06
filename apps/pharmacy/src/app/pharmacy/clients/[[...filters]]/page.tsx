import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import {
  buildClientsPath,
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

  const filters = parseClientsSegments({ filters: route.filters });
  const canonical = buildClientsPath(filters);
  const requestedPath = `/pharmacy/clients${route.filters.length ? `/${route.filters.join('/')}` : ''}`;

  if (requestedPath !== canonical) redirect(canonical);

  return <ClientsPageContent initialFilters={filters} />;
}

export default ClientsPage;
