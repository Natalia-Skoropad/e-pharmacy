import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { getOwnProductDetailTabPath } from '@/lib/products/own-product-detail-tabs';

import {
  buildRelatedProductOrdersPath,
  isOrdersFilterRoute,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
} from '@/lib/orders/order-paths';

import {
  buildStockMovementPath,
  parseStockMovementSegments,
} from '@/lib/products/stock-movement-paths';

import {
  buildOwnProductClientsPath,
  parseOwnProductClientsSegments,
} from '@/lib/products/own-product-clients-paths';

import {
  buildOwnProductPharmaciesPath,
  parseOwnProductPharmaciesSegments,
} from '@/lib/products/own-product-pharmacies-paths';

import {
  parseSalesChartSegments,
  buildSalesChartPath,
} from '@/lib/statistics/sales-chart-paths';

import {
  isOwnProductsFilterRoute,
  buildOwnProductsPath,
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
} from '@/lib/products/own-product-paths';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnerOwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

// The optional list catch-all and own-product details share /pharmacy/products.
// Registry filters must still resolve as the registry, not as a product ID.
export default async function OwnProductStatisticsFiltersRoute({
  params,
}: Readonly<{
  params: Promise<{ productId: string; tab: string; filters: string[] }>;
}>) {
  const { productId, tab, filters } = await params;
  const allSegments = [productId, tab, ...filters];
  const requested = `/pharmacy/products/${allSegments.join('/')}`;

  if (isOwnProductsFilterRoute(allSegments)) {
    const parsed = parseOwnProductsSegments({ filters: allSegments });

    const pagination = parseOwnProductsPaginationSegments({
      filters: allSegments,
    });

    const canonical = buildOwnProductsPath(parsed, pagination);

    if (requested !== canonical) redirect(canonical);

    return (
      <OwnerOwnProductsPageContent
        initialFilters={parsed}
        initialPagination={pagination}
      />
    );
  }

  if (
    !isValidObjectId(productId) ||
    ![
      'statistics',
      'stock-movement',
      'clients',
      'pharmacies',
      'related-orders',
    ].includes(tab)
  )
    notFound();

  let canonical: string;

  try {
    if (tab === 'related-orders') {
      if (!isOrdersFilterRoute(filters)) notFound();

      canonical = buildRelatedProductOrdersPath(
        productId,
        parseOrdersSegments({ filters }),
        parseOrdersPaginationSegments({ filters })
      );
    } else if (tab === 'stock-movement') {
      canonical = buildStockMovementPath(
        productId,
        parseStockMovementSegments(filters)
      );
    } else if (tab === 'clients') {
      canonical = buildOwnProductClientsPath(
        productId,
        parseOwnProductClientsSegments(filters)
      );
    } else if (tab === 'pharmacies') {
      canonical = buildOwnProductPharmaciesPath(
        productId,
        parseOwnProductPharmaciesSegments(filters)
      );
    } else {
      const state = parseSalesChartSegments(filters, { allowPharmacy: true });

      canonical = buildSalesChartPath(
        getOwnProductDetailTabPath(productId, 'statistics'),
        state,
        { allowPharmacy: true }
      );
    }
  } catch {
    notFound();
  }

  if (requested !== canonical) redirect(canonical);

  return <OwnProductDetailsPageContent productId={productId} />;
}
