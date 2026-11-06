import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import type { OwnedPharmacyListUrlState } from '@/lib/pharmacies/owned-pharmacy-url';

import {
  buildClientPharmaciesPath,
  parseClientPharmaciesSegments,
} from '@/lib/clients/client-pharmacies-path';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';

//===================================================================

export default async function ClientPharmaciesFilteredPage({
  params,
}: Readonly<{ params: Promise<{ clientId: string; filters: string[] }> }>) {
  const { clientId, filters } = await params;

  if (!isValidObjectId(clientId)) notFound();

  let state: OwnedPharmacyListUrlState;

  try {
    state = parseClientPharmaciesSegments(filters);
  } catch {
    notFound();
  }

  const canonical = buildClientPharmaciesPath(clientId, state);

  if (
    `/pharmacy/clients/${clientId}/pharmacies/${filters.join('/')}` !==
    canonical
  ) {
    redirect(canonical);
  }

  return (
    <ClientDetailsPageContent
      clientId={clientId}
      initialTab="pharmacies"
      initialPharmacyFilters={state}
    />
  );
}
