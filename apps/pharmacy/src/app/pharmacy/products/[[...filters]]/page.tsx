import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOwnProductsFilterRoute,
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
  buildOwnProductsPath,
  type OwnProductsRouteParams,
} from '@/lib/products/own-product-paths';

import {
  getOwnProductDetailTabPath,
  isOwnProductDetailTab,
} from '@/lib/products/own-product-detail-tabs';

import {
  parseSalesChartSegments,
  buildSalesChartPath,
} from '@/lib/statistics/sales-chart-paths';

import {
  buildOwnProductClientsPath,
  parseOwnProductClientsSegments,
} from '@/lib/products/own-product-clients-paths';

import {
  buildOwnProductPharmaciesPath,
  parseOwnProductPharmaciesSegments,
} from '@/lib/products/own-product-pharmacies-paths';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnerOwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Own products',
  description: 'View products added to the current pharmacy.',
};

//===================================================================

type ProductsPageProps = Readonly<{
  params?: Promise<OwnProductsRouteParams>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.filters;

  if (!isOwnProductsFilterRoute(segments)) {
    const productId = segments?.[0];
    const tab = segments?.[1];

    if (!productId || !isValidObjectId(productId)) notFound();

    // Defensive fallback for the optional catch-all matcher. A stale Next.js
    // dev route manifest may resolve new /products/:id/:tab URLs here rather
    // than in /[productId]/[tab] until the development server is restarted.
    // Never interpret an unknown tab (or extra segments) as a product page.
    if (segments?.length === 2 && tab && isOwnProductDetailTab(tab)) {
      if (tab === 'details') {
        redirect(getOwnProductDetailTabPath(productId, tab));
      }

      return <OwnProductDetailsPageContent productId={productId} />;
    }

    if (segments && segments.length > 2 && tab === 'pharmacies') {
      let canonical: string;

      try {
        canonical = buildOwnProductPharmaciesPath(
          productId,
          parseOwnProductPharmaciesSegments(segments.slice(2))
        );
      } catch {
        notFound();
      }

      if (`/pharmacy/products/${segments.join('/')}` !== canonical)
        redirect(canonical);

      return <OwnProductDetailsPageContent productId={productId} />;
    }

    if (segments && segments.length > 2 && tab === 'clients') {
      let canonical: string;

      try {
        canonical = buildOwnProductClientsPath(
          productId,
          parseOwnProductClientsSegments(segments.slice(2))
        );
      } catch {
        notFound();
      }

      if (`/pharmacy/products/${segments.join('/')}` !== canonical)
        redirect(canonical);

      return <OwnProductDetailsPageContent productId={productId} />;
    }

    if (segments && segments.length > 2 && tab === 'statistics') {
      let canonical: string;

      try {
        canonical = buildSalesChartPath(
          getOwnProductDetailTabPath(productId, 'statistics'),
          parseSalesChartSegments(segments.slice(2), { allowPharmacy: true }),
          { allowPharmacy: true }
        );
      } catch {
        notFound();
      }

      if (`/pharmacy/products/${segments.join('/')}` !== canonical)
        redirect(canonical);

      return <OwnProductDetailsPageContent productId={productId} />;
    }

    if (segments?.length === 1) {
      return <OwnProductDetailsPageContent productId={productId} />;
    }

    notFound();
  }

  const initialFilters = parseOwnProductsSegments(resolvedParams);
  const initialPagination = parseOwnProductsPaginationSegments(resolvedParams);
  const query = await searchParams;

  // Replace obsolete selected-pharmacy query links with the canonical path.
  if (query?.pharmacyId && isValidObjectId(query.pharmacyId)) {
    redirect(
      buildOwnProductsPath(
        { ...initialFilters, pharmacyId: query.pharmacyId },
        initialPagination
      )
    );
  }

  return (
    <OwnerOwnProductsPageContent
      key={JSON.stringify({ initialFilters, initialPagination })}
      initialFilters={initialFilters}
      initialPagination={initialPagination}
    />
  );
}

export default ProductsPage;
