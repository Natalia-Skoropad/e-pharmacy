import type { Metadata } from 'next';

import { OwnProductDetailsPageContent } from '@/components/products/OwnProductDetailsPageContent';
import { OwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

import {
  isOwnProductsFilterRoute,
  parseOwnProductsSegments,
  type OwnProductsRouteParams,
} from '@/lib/products/own-product-paths';

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
    return <OwnProductDetailsPageContent productId={segments?.[0] ?? ''} />;
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
