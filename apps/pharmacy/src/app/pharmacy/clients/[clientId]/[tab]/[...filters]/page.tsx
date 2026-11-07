import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  buildClientsPath,
  parseClientsPaginationSegments,
  parseClientsSegments,
  resolveClientsRoute,
} from '@/lib/clients/client-paths';

import {
  buildClientDetailPaginationPath,
  parseClientDetailPaginationSegments,
  type ClientDetailListTab,
  type ClientDetailPagination,
} from '@/lib/clients/client-detail-pagination';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';

//===================================================================

// The dynamic route can win over /clients/[[...filters]] for a three-or-more
// segment registry URL. Recognize owner filters *before* detail validation.
export default async function ClientDetailPaginatedTab({
  params,
}: Readonly<{
  params: Promise<{ clientId: string; tab: string; filters: string[] }>;
}>) {
  const { clientId, tab, filters } = await params;
  const segments = [clientId, tab, ...filters];
  const requestedPath = `/pharmacy/clients/${segments.join('/')}`;
  const route = resolveClientsRoute(segments);

  if (route.kind === 'filters') {
    const clientFilters = parseClientsSegments({ filters: route.filters });
    const pagination = parseClientsPaginationSegments(route.filters);
    const canonical = buildClientsPath(clientFilters, undefined, pagination);

    if (requestedPath !== canonical) redirect(canonical);

    return (
      <ClientsPageContent
        initialFilters={clientFilters}
        initialPage={pagination.page}
        initialPerPage={pagination.perPage}
      />
    );
  }

  if (!isValidObjectId(clientId) || (tab !== 'orders' && tab !== 'products')) {
    notFound();
  }

  let pagination: ClientDetailPagination;

  try {
    pagination = parseClientDetailPaginationSegments(filters);
  } catch {
    notFound();
  }

  const canonical = buildClientDetailPaginationPath(
    clientId,
    tab as ClientDetailListTab,
    pagination
  );

  if (requestedPath !== canonical) redirect(canonical);

  return (
    <ClientDetailsPageContent
      clientId={clientId}
      initialTab={tab as ClientDetailListTab}
    />
  );
}
