import type { Metadata } from 'next';

import { getClientDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

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

  return (
    <CabinetPage
      title={`Client ${clientId}`}
      description="Readonly client details skeleton with related pharmacy orders only."
      breadcrumbs={getClientDetailsBreadcrumbs(clientId)}
    >
      <PlaceholderCards
        items={[
          'Readonly contacts',
          'First order in current pharmacy',
          'Orders count in current pharmacy',
          'Total spent in current pharmacy',
          'Related orders table',
        ]}
      />
    </CabinetPage>
  );
}

export default ClientDetailsPage;
