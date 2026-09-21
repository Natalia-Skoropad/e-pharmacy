import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isOwnProductsFilterRoute,
  parseOwnProductsSegments,
  type OwnProductsRouteParams,
} from '@/lib/products/own-product-paths';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Own products',
  description: 'View products added to the current pharmacy.',
};

//===================================================================

type ProductsPageProps = Readonly<{
  params?: Promise<OwnProductsRouteParams>;
}>;

//===================================================================

async function ProductsPage({ params }: ProductsPageProps) {
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

  return (
    <OwnProductsPageContent
      key={JSON.stringify(initialFilters)}
      initialFilters={initialFilters}
    />
  );
}

export default ProductsPage;
