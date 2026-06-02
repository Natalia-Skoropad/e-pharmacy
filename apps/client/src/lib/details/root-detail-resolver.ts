import { cache } from 'react';

import { isReservedRootSlug } from '@e-pharmacy/config';
import { buildSlugId } from '@e-pharmacy/utils';

import { buildProductPath, buildStorePath } from '@/lib/routes';
import { getProductBySlugId } from '@/lib/details/product-detail-page';
import { getStoreBySlugId } from '@/lib/details/store-detail-page';

import type { Product, Store } from '@/types';

//===================================================================

type ProductRootDetail = {
  type: 'product';
  product: Product;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

type StoreRootDetail = {
  type: 'store';
  store: Store;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

export type RootDetail = ProductRootDetail | StoreRootDetail;

//===================================================================

function createProductRootDetail(
  slugId: string,
  product: Product
): ProductRootDetail {
  const canonicalSlugId = buildSlugId(product.name, product.id);

  return {
    type: 'product',
    product,
    canonicalPath: buildProductPath(product.name, product.id),
    isCanonicalSlug: slugId === canonicalSlugId,
  };
}

//===================================================================

function createStoreRootDetail(slugId: string, store: Store): StoreRootDetail {
  const canonicalSlugId = buildSlugId(store.name, store.id);

  return {
    type: 'store',
    store,
    canonicalPath: buildStorePath(store.name, store.id),
    isCanonicalSlug: slugId === canonicalSlugId,
  };
}

//===================================================================

export const resolveRootDetailBySlugId = cache(async function resolveRootDetailBySlugId(
  slugId: string
): Promise<RootDetail | null> {
  if (isReservedRootSlug(slugId)) return null;

  const [product, store] = await Promise.all([
    getProductBySlugId(slugId),
    getStoreBySlugId(slugId),
  ]);

  const details = [
    product ? createProductRootDetail(slugId, product) : null,
    store ? createStoreRootDetail(slugId, store) : null,
  ].filter((detail): detail is RootDetail => Boolean(detail));

  if (details.length === 0) return null;

  const exactCanonicalMatch = details.find((detail) => detail.isCanonicalSlug);

  return exactCanonicalMatch ?? details[0];
});
