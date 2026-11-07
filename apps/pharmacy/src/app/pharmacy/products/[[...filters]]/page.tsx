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
    const productId = segments?.length === 1 ? segments[0] : null;

    if (!productId || !isValidObjectId(productId)) {
      notFound();
    }

    return <OwnProductDetailsPageContent productId={productId} />;
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
