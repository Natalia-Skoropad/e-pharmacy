import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  parseClientsSegments,
  resolveClientsRoute,
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
    return (
      <ClientsPageContent
        initialFilters={parseClientsSegments({ filters: route.filters })}
      />
    );
  }

  return <ClientDetailsPageContent clientId={route.clientId} />;
}

export default ClientDetailsPage;
