import 'server-only';

import {
  getPharmacySearchOptions,
  getProductFilters,
  getProductDetails,
  PUBLIC_DICTIONARY_CACHE_OPTIONS,
  PUBLIC_COMMERCE_CACHE_OPTIONS,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo/server';

import {
  buildProductCatalogCanonicalPath,
  getProductCatalogDescription,
  getProductCatalogTitle,
  isProductCatalogNoIndex,
  type ProductCatalogFilters,
} from './product-catalog';

//===================================================================

/** Metadata lookups run in parallel and reuse public cached catalog data. */
export async function getProductCatalogMetadata(
  filters: ProductCatalogFilters
) {
  const [categoryLabel, selectedPharmacy, selectedProduct] = await Promise.all([
    filters.category === 'all'
      ? Promise.resolve(undefined)
      : getProductFilters({}, PUBLIC_DICTIONARY_CACHE_OPTIONS)
          .then(
            (data) =>
              data.categories.find(
                (category) => category.value === filters.category
              )?.label
          )
          .catch(() => undefined),

    !filters.pharmacyId
      ? Promise.resolve(undefined)
      : getPharmacySearchOptions(
          {
            kind: 'pharmacy',
            selectedId: filters.pharmacyId,
            page: 1,
            perPage: 1,
          },
          PUBLIC_DICTIONARY_CACHE_OPTIONS
        )
          .then((data) =>
            data.kind === 'pharmacy'
              ? data.items.find(
                  (pharmacy) => pharmacy.id === filters.pharmacyId
                )
              : undefined
          )
          .catch(() => undefined),

    !filters.productId
      ? Promise.resolve(undefined)
      : getProductDetails(filters.productId, PUBLIC_COMMERCE_CACHE_OPTIONS)
          .then((data) => data.product)
          .catch(() => undefined),
  ]);

  const seoContext = {
    ...(categoryLabel ? { categoryLabel } : {}),
    ...(selectedPharmacy ? { pharmacyName: selectedPharmacy.name } : {}),
    ...(selectedProduct ? { productName: selectedProduct.name } : {}),
  };

  // If the selected pharmacy and product both exist, the pharmacy photo wins:
  // these combinations are explicitly a pharmacy-filtered product listing.
  const image = selectedPharmacy?.imageUrl ?? selectedProduct?.imageUrl;

  const imageAlt = selectedPharmacy?.imageUrl
    ? `${selectedPharmacy.name} pharmacy photo`
    : selectedProduct?.imageUrl
      ? `${selectedProduct.name} product photo`
      : undefined;

  return createPageMetadata({
    title: getProductCatalogTitle(filters, seoContext),
    description: getProductCatalogDescription(filters, seoContext),

    path: buildProductCatalogCanonicalPath(
      filters,
      selectedPharmacy ? [selectedPharmacy] : []
    ),

    ...(image ? { image, imageAlt } : {}),

    noIndex:
      isProductCatalogNoIndex(filters) ||
      (filters.category !== 'all' && !categoryLabel) ||
      Boolean(filters.productId && !selectedProduct) ||
      Boolean(filters.pharmacyId && !selectedPharmacy),
  });
}
