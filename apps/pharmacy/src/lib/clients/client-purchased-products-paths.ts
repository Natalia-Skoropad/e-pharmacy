import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  DEFAULT_CLIENT_DETAIL_PAGINATION,
  parseClientDetailPaginationSegments,
  type ClientDetailPagination,
} from './client-detail-pagination';

import {
  parseOwnProductsSegments,
  buildOwnProductsPath,
  type OwnProductsPagination,
} from '@/lib/products/own-product-paths';

import { DEFAULT_OWN_PRODUCTS_FILTERS } from '@/lib/products/own-products-filters';

import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';

//===================================================================

export type ClientProductFilters = Readonly<{
  date: Readonly<{ from: string; to: string }>;
  productId: string;
  category: 'all' | ProductCategorySlug;
  status: 'all' | 'active' | 'blocked';
}>;

//===================================================================

export type ClientPurchasedProductsState = Readonly<{
  filters: ClientProductFilters;
  pagination: ClientDetailPagination;
}>;

//===================================================================

export const DEFAULT_CLIENT_PURCHASED_PRODUCTS_FILTERS: ClientProductFilters = {
  date: { from: '', to: '' },
  productId: '',
  category: 'all',
  status: 'all',
};

//===================================================================

const CLIENT_PRODUCT_PREFIXES = [
  'product-id-',
  'category-',
  'status-',
  'date-from-',
  'date-to-',
  'per-page-',
  'page-',
] as const;

//===================================================================

export function parseClientPurchasedProductsSegments(
  segments: readonly string[]
): ClientPurchasedProductsState {
  const seen = new Set<string>();

  for (const segment of segments) {
    const prefix = CLIENT_PRODUCT_PREFIXES.find((item) =>
      segment.startsWith(item)
    );

    if (!prefix || seen.has(prefix))
      throw new TypeError('Invalid or duplicate client product filter.');

    seen.add(prefix);
  }

  const pagination = parseClientDetailPaginationSegments(
    segments.filter(
      (segment) =>
        segment.startsWith('per-page-') || segment.startsWith('page-')
    )
  );

  const parsed = parseOwnProductsSegments({ filters: [...segments] });

  return {
    filters: {
      date: parsed.createdDate,
      productId: parsed.productId,
      category: parsed.category,
      status: parsed.status,
    },

    pagination,
  };
}

//===================================================================

export function buildClientPurchasedProductsPath(
  clientId: string,
  filters: ClientProductFilters,
  pagination: OwnProductsPagination = DEFAULT_CLIENT_DETAIL_PAGINATION
): string {
  if (!isValidObjectId(clientId)) throw new TypeError('Invalid client ID.');

  const generic = buildOwnProductsPath(
    {
      ...DEFAULT_OWN_PRODUCTS_FILTERS,
      productId: filters.productId,
      createdDate: filters.date,
      category: filters.category,
      status: filters.status,
    },

    pagination
  );

  return `/pharmacy/clients/${clientId.toLowerCase()}/products${generic.slice('/pharmacy/products'.length)}`;
}

//===================================================================

export function parseClientPurchasedProductsPath(
  pathname: string,
  clientId: string
): ClientPurchasedProductsState {
  const base = `/pharmacy/clients/${clientId}/products`;

  if (pathname === base)
    return {
      filters: DEFAULT_CLIENT_PURCHASED_PRODUCTS_FILTERS,
      pagination: DEFAULT_CLIENT_DETAIL_PAGINATION,
    };

  if (!pathname.startsWith(`${base}/`))
    return {
      filters: DEFAULT_CLIENT_PURCHASED_PRODUCTS_FILTERS,
      pagination: DEFAULT_CLIENT_DETAIL_PAGINATION,
    };

  return parseClientPurchasedProductsSegments(
    pathname.slice(base.length + 1).split('/')
  );
}
