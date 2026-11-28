import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  buildClientsPath,
  parseClientsPaginationSegments,
  parseClientsSegments,
  resolveClientsRoute,
} from '@/lib/clients/client-paths';

import {
  parseClientPurchasedProductsSegments,
  buildClientPurchasedProductsPath,
} from '@/lib/clients/client-purchased-products-paths';

import {
  parseSalesChartSegments,
  buildSalesChartPath,
} from '@/lib/statistics/sales-chart-paths';

import { getPharmacyClientPath } from '@/lib/routes';

import {
  buildClientOrdersPath,
  isOrdersFilterRoute,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
} from '@/lib/orders/order-paths';

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
    (tab !== 'orders' &&
      tab !== 'products' &&
      tab !== 'details' &&
      tab !== 'statistics')
  ) {
    notFound();
  }

  let canonical: string;

  try {
    if (tab === 'details' || tab === 'statistics') {
      const filtersState = parseSalesChartSegments(filters, {
        allowPharmacy: tab === 'statistics',
      });

      canonical = buildSalesChartPath(
        `${getPharmacyClientPath(clientId)}/statistics`,
        filtersState,
        { allowPharmacy: true }
      );
    } else if (tab === 'products') {
      const state = parseClientPurchasedProductsSegments(filters);

      canonical = buildClientPurchasedProductsPath(
        clientId,
        state.filters,
        state.pagination
      );
    } else {
      if (
        !isOrdersFilterRoute(filters) ||
        filters.some((part) => part.startsWith('client-id-'))
      )
        notFound();

      canonical = buildClientOrdersPath(
        clientId,
        parseOrdersSegments({ filters }),
        parseOrdersPaginationSegments({ filters })
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
