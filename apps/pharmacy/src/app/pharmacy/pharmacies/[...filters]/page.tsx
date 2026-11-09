import { notFound, redirect } from 'next/navigation';

import {
  buildClientsPath,
  parseClientsSegments,
  parseClientsPaginationSegments,
} from '@/lib/clients/client-paths';

import {
  buildOwnedPharmaciesListUrl,
  buildOwnedPharmacyDetailUrl,
  parseOwnedPharmaciesListSegments,
  resolveOwnedPharmaciesRoute,
} from '@/lib/pharmacies/owned-pharmacy-url';

import {
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
  buildEmbeddedOwnProductsPath,
} from '@/lib/products/own-product-paths';

import {
  parseSalesChartSegments,
  buildSalesChartPath,
} from '@/lib/statistics/sales-chart-paths';

import { OwnedPharmaciesPageContent } from '@/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent';
import { OwnedPharmacyDetailPageContent } from '@/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent';

//===================================================================

export default async function OwnedPharmaciesRoute({
  params,
}: Readonly<{ params: Promise<{ filters: string[] }> }>) {
  const { filters } = await params;
  const route = resolveOwnedPharmaciesRoute(filters);

  if (route.kind === 'invalid') notFound();

  if (route.kind === 'detail') {
    const base = buildOwnedPharmacyDetailUrl(route.pharmacyId, route.tab);

    const clientFilters =
      route.tab === 'clients'
        ? parseClientsSegments({ filters: [...route.clientSegments] })
        : undefined;

    const pagination =
      route.tab === 'clients'
        ? parseClientsPaginationSegments(route.clientSegments)
        : undefined;

    const productFilters =
      route.tab === 'products'
        ? parseOwnProductsSegments({ filters: [...route.productSegments] })
        : undefined;

    const productPagination =
      route.tab === 'products'
        ? parseOwnProductsPaginationSegments({
            filters: [...route.productSegments],
          })
        : undefined;

    const canonical =
      route.tab === 'information' && route.salesSegments.length
        ? buildSalesChartPath(
            base,
            parseSalesChartSegments(route.salesSegments)
          )
        : clientFilters && pagination
          ? buildClientsPath(clientFilters, base, pagination)
          : productFilters && productPagination
            ? buildEmbeddedOwnProductsPath(
                route.pharmacyId,
                productFilters,
                productPagination
              )
            : base;

    if (`/pharmacy/pharmacies/${filters.join('/')}` !== canonical)
      redirect(canonical);

    return (
      <OwnedPharmacyDetailPageContent
        pharmacyId={route.pharmacyId}
        activeTab={route.tab}
        initialClientFilters={clientFilters}
        initialClientPagination={pagination}
        initialProductFilters={productFilters}
        initialProductPagination={productPagination}
      />
    );
  }

  const state = parseOwnedPharmaciesListSegments(route.filters);
  const canonical = buildOwnedPharmaciesListUrl(state);

  if (`/pharmacy/pharmacies/${filters.join('/')}` !== canonical)
    redirect(canonical);

  return <OwnedPharmaciesPageContent initialState={state} />;
}
