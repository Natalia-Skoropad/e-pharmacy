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

import {
  parseClientPurchasedProductsSegments,
  buildClientPurchasedProductsPath,
} from '@/lib/clients/client-purchased-products-paths';

import {
  parseSalesChartSegments,
  buildSalesChartPath,
} from '@/lib/statistics/sales-chart-paths';

import { getPharmacyClientPath } from '@/lib/routes';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';
import type { ClientDetailTab } from '@/components/clients/client-detail-resource-policy';
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

  if (
    !isValidObjectId(clientId) ||
    (tab !== 'orders' && tab !== 'products' && tab !== 'details')
  ) {
    notFound();
  }

  let canonical: string;

  try {
    if (tab === 'details') {
      const filtersState = parseSalesChartSegments(filters);

      canonical = buildSalesChartPath(
        `${getPharmacyClientPath(clientId)}/details`,
        filtersState
      );

      if (canonical === `${getPharmacyClientPath(clientId)}/details`)
        canonical = getPharmacyClientPath(clientId);
    } else if (tab === 'products') {
      const state = parseClientPurchasedProductsSegments(filters);

      canonical = buildClientPurchasedProductsPath(
        clientId,
        state.filters,
        state.pagination
      );
    } else {
      const pagination: ClientDetailPagination =
        parseClientDetailPaginationSegments(filters);

      canonical = buildClientDetailPaginationPath(
        clientId,
        tab as ClientDetailListTab,
        pagination
      );
    }
  } catch {
    notFound();
  }

  if (requestedPath !== canonical) redirect(canonical);

  return (
    <ClientDetailsPageContent
      clientId={clientId}
      initialTab={tab as ClientDetailTab}
    />
  );
}
