import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import {
  buildClientsPath,
  parseClientsSegments,
  resolveClientsRoute,
  parseClientsPaginationSegments,
} from '@/lib/clients/client-paths';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Client details',
  description: 'View readonly client details for the current pharmacy.',
};

//===================================================================

type ClientDetailsPageProps = Readonly<{
  params: Promise<{ clientId: string }>;
}>;

//===================================================================

async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { clientId } = await params;
  const route = resolveClientsRoute([clientId]);

  if (route.kind === 'invalid') {
    notFound();
  }

  if (route.kind === 'filters') {
    const filters = parseClientsSegments({ filters: route.filters });
    const pagination = parseClientsPaginationSegments(route.filters);
    const canonical = buildClientsPath(filters, undefined, pagination);

    if (`/pharmacy/clients/${clientId}` !== canonical) redirect(canonical);

    return (
      <ClientsPageContent
        initialFilters={filters}
        initialPage={pagination.page}
        initialPerPage={pagination.perPage}
      />
    );
  }

  return <ClientDetailsPageContent clientId={route.clientId} />;
}

export default ClientDetailsPage;
