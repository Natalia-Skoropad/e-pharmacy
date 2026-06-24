import {
  buildProductCatalogCanonicalPath,
  FALLBACK_PRODUCT_FILTER_OPTIONS,
  getProductCatalogDescription,
  getProductCatalogTitle,
  isProductCatalogNoIndex,
  parseProductCatalogSearchParams,
  type ProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog';

import { loadProductCatalogPageData } from '@/lib/catalog/product-catalog-server';
import { createPageMetadata } from '@/lib/seo';

import { ProductCatalogPageContent } from '@/components/product-catalog';

//===================================================================

type ProductCatalogPageProps = {
  searchParams?: Promise<ProductCatalogSearchParams>;
};

//===================================================================

export async function generateMetadata({
  searchParams,
}: ProductCatalogPageProps) {
  const filters = parseProductCatalogSearchParams(await searchParams);

  const categoryLabel = FALLBACK_PRODUCT_FILTER_OPTIONS.categories.find(
    (option) => option.value === filters.category
  )?.label;

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
  };

  return createPageMetadata({
    title: getProductCatalogTitle(filters, seoContext),
    description: getProductCatalogDescription(filters, seoContext),
    path: buildProductCatalogCanonicalPath(filters),
    noIndex: isProductCatalogNoIndex(filters),
  });
}

//===================================================================

async function ProductCatalogPage({ searchParams }: ProductCatalogPageProps) {
  const filters = parseProductCatalogSearchParams(await searchParams);
  const pageData = await loadProductCatalogPageData(filters);

  return <ProductCatalogPageContent {...pageData} />;
}

export default ProductCatalogPage;
