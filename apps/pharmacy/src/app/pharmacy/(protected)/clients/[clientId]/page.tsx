import type { Metadata } from 'next';

import { getClientDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { LockedPharmacyFeaturePage } from '@/components/shared/LockedPharmacyFeaturePage';

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
    <LockedPharmacyFeaturePage
      title={`Client ${clientId}`}
      description="Client details open only after verified pharmacy orders create real client relationships."
      breadcrumbs={getClientDetailsBreadcrumbs(clientId)}
      featureName="Client details"
    />
  );
}

export default ClientDetailsPage;
