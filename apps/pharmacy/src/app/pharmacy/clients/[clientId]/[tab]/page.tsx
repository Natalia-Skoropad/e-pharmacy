import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  buildClientsPath,
  parseClientsSegments,
  resolveClientsRoute,
  parseClientsPaginationSegments,
} from '@/lib/clients/client-paths';

import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';
import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';

import type { ClientDetailTab } from '@/components/clients/client-detail-resource-policy';

//===================================================================

export const metadata: Metadata = { title: 'Client details' };

//===================================================================

const SUPPORTED_TABS = ['orders', 'products', 'comments'] as const;

//===================================================================

export default async function ClientDetailTabPage({
  params,
}: Readonly<{ params: Promise<{ clientId: string; tab: string }> }>) {
  const { clientId, tab } = await params;

  // Next.js prioritizes /[clientId]/[tab] over /[[...filters]] for two
  // segments. Treat two filter segments as the Clients registry, not a detail.
  const route = resolveClientsRoute([clientId, tab]);

  if (route.kind === 'filters') {
    const filters = parseClientsSegments({ filters: route.filters });
    const pagination = parseClientsPaginationSegments(route.filters);
    const canonical = buildClientsPath(filters, undefined, pagination);

    if (`/pharmacy/clients/${clientId}/${tab}` !== canonical)
      redirect(canonical);

    return (
      <ClientsPageContent
        initialFilters={filters}
        initialPage={pagination.page}
        initialPerPage={pagination.perPage}
      />
    );
  }

  if (
    !isValidObjectId(clientId) ||
    !SUPPORTED_TABS.some((allowed) => allowed === tab)
  )
    notFound();

  return (
    <ClientDetailsPageContent
      clientId={clientId}
      initialTab={tab as ClientDetailTab}
    />
  );
}
