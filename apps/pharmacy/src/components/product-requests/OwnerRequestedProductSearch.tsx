'use client';

import { useCallback } from 'react';

import type { ProductRequestsQueryParams } from '@/lib/product-requests/product-requests';
import { getPharmacyProductRequests } from '@/lib/api/browser';

import {
  OwnerProductSearch,
  type ProductSuggestionsLoader,
} from '@/components/all-products/OwnerProductSearch/OwnerProductSearch';

//===================================================================

/**
 * Reuse the global-catalog select UI, but never fetch the whole catalog.
 * Only products included in requests owned by this account may be
 * suggested, including requests not yet linked to the global catalog.
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
      // The explicit prefix distinguishes an unlinked request-product from
      // an Admin global product. Never substitute a request ID as productId.
      const unlinkedRequestId = params.productId?.startsWith('request-')
        ? params.productId.slice('request-'.length)
        : undefined;

      const response = await getPharmacyProductRequests(
        {
          ...relatedFilters,
          requestId: unlinkedRequestId,
          productId: unlinkedRequestId ? undefined : params.productId,
          keyword: params.keyword || undefined,
          page: params.page ?? 1,
          perPage: params.perPage ?? 20,
        },

        options
      );

      return {
        page: response.page,
        totalPages: response.totalPages,

        items: response.items.map((request) => ({
          id: request.productId ?? `request-${request.id}`,
          name: request.productName,
          article: request.productArticle,
          imageUrl: request.productImageUrl,
        })),
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
      description="Find products appearing in your product requests by article or name. Selecting a request automatically selects its product."
    />
  );
}
