import type { Metadata } from 'next';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';

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

  return <ClientDetailsPageContent clientId={clientId} />;
}

export default ClientDetailsPage;
