import type { Metadata } from 'next';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';

import {
  isClientsFilterSegment,
  parseClientsSegments,
} from '@/lib/clients/client-paths';

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

  if (isClientsFilterSegment(clientId)) {
    return (
      <ClientsPageContent
        initialFilters={parseClientsSegments({ filters: [clientId] })}
      />
    );
  }

  return <ClientDetailsPageContent clientId={clientId} />;
}

export default ClientDetailsPage;
