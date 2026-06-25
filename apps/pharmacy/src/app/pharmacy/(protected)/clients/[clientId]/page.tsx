import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

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
    <PharmacyPage
      title={`Client ${clientId}`}
      description="Readonly client details skeleton with related pharmacy orders only."
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
    </PharmacyPage>
  );
}

export default ClientDetailsPage;
