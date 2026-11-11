import { permanentRedirect } from 'next/navigation';

import {
  buildProductCatalogPath,
  parseProductCatalogSearchParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { loadProductCatalogPageData } from '@/lib/catalog/product-catalog-server';
import { hasCatalogSearchParams } from '@/lib/catalog/catalog-param-utils';

import { getProductCatalogMetadata } from '@/lib/catalog/product-catalog-metadata';

import { ProductCatalogPageContent } from '@/components/product-catalog';

//===================================================================

type ProductCatalogPageProps = {
  searchParams?: Promise<ProductCatalogSearchParams>;
};

//===================================================================

export async function generateMetadata({
  searchParams,
}: ProductCatalogPageProps) {
  return getProductCatalogMetadata(
    parseProductCatalogSearchParams(await searchParams)
  );
}

//===================================================================

async function ProductCatalogPage({ searchParams }: ProductCatalogPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseProductCatalogSearchParams(resolvedSearchParams);
  const pageData = await loadProductCatalogPageData(filters);

  if (hasCatalogSearchParams(resolvedSearchParams)) {
    permanentRedirect(buildProductCatalogPath(filters, pageData.pharmacies));
  }

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogPage;
