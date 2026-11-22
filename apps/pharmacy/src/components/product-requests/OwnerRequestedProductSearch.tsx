'use client';

import { useCallback } from 'react';

import type { ProductRequestsQueryParams } from '@/lib/product-requests/product-requests';
import { getPharmacyProductRequests } from '@/lib/api/browser';

import {
  OwnerProductSearch,
  type ProductSuggestionsLoader,
  type ProductSearchItem,
} from '@/components/all-products/OwnerProductSearch/OwnerProductSearch';

//===================================================================

/**
 * Reuse the global-catalog select UI, but never fetch the whole catalog.
 * Only global products referenced by this owner's requests may be
 * suggested. Draft requests without a global product are not product options.
 * Other active request filters apply to the choices in this selector.
 */
export function OwnerRequestedProductSearch({
  value,
  onChange,
  relatedFilters,
}: Readonly<{
  value: string;
  onChange: (id: string) => void;
  relatedFilters: ProductRequestsQueryParams;
}>) {
  const scopeKey = JSON.stringify(relatedFilters);

  const loadProducts = useCallback<ProductSuggestionsLoader>(
    async (params, options) => {
      const response = await getPharmacyProductRequests(
        {
          ...relatedFilters,

          // Product search lists only linked global products from the owner's
          // requests. Unlinked requests belong in Product request search.
          linkedOnly: true,
          productId: params.productId,
          keyword: params.keyword || undefined,
          page: params.page ?? 1,
          perPage: params.perPage ?? 20,
        },
        options
      );

      const products = new Map<string, ProductSearchItem>();

      for (const request of response.items) {
        if (!request.productId) continue;

        products.set(request.productId, {
          id: request.productId,
          name: request.productName,
          article: request.productArticle,
          imageUrl: request.productImageUrl,
        });
      }

      return {
        page: response.page,
        totalPages: response.totalPages,
        items: [...products.values()],
      };
    },
    [relatedFilters]
  );

  // The underlying select stores its loaded pages. Remount when the linked
  // Request/date/category/status scope changes so stale options cannot linger.
  return (
    <OwnerProductSearch
      key={scopeKey}
      id="product-requests-product-search"
      value={value}
      onChange={onChange}
      loadProducts={loadProducts}
      selectedFallbackLabel="Selected product"
      description="Find only global catalog products linked to your product requests. Draft requests without a linked product are available through Product request search."
    />
  );
}
