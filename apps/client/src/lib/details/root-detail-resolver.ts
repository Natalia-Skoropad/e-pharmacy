import { cache } from 'react';

import { isReservedRootSlug } from '@e-pharmacy/config';

import {
  buildProductPath,
  buildSlugId,
  buildPharmacyPath,
} from '@e-pharmacy/config/routes';

import { getProductBySlugId } from '@/lib/details/product-detail-page';
import { getPharmacyBySlugId } from '@/lib/details/pharmacy-detail-page';

import type { Product, Pharmacy } from '@e-pharmacy/types';

//===================================================================

type ProductRootDetail = {
  type: 'product';
  product: Product;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

type PharmacyRootDetail = {
  type: 'pharmacy';
  pharmacy: Pharmacy;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

export type RootDetail = ProductRootDetail | PharmacyRootDetail;

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

function createPharmacyRootDetail(slugId: string, pharmacy: Pharmacy): PharmacyRootDetail {
  const canonicalSlugId = buildSlugId(pharmacy.name, pharmacy.id);

  return {
    type: 'pharmacy',
    pharmacy,
    canonicalPath: buildPharmacyPath(pharmacy.name, pharmacy.id),
    isCanonicalSlug: slugId === canonicalSlugId,
  };
}

//===================================================================

export const resolveRootDetailBySlugId = cache(async function resolveRootDetailBySlugId(
  slugId: string
): Promise<RootDetail | null> {
  if (isReservedRootSlug(slugId)) return null;

  const [product, pharmacy] = await Promise.all([
    getProductBySlugId(slugId),
    getPharmacyBySlugId(slugId),
  ]);

  const details = [
    product ? createProductRootDetail(slugId, product) : null,
    pharmacy ? createPharmacyRootDetail(slugId, pharmacy) : null,
  ].filter((detail): detail is RootDetail => Boolean(detail));

  if (details.length === 0) return null;

  const exactCanonicalMatch = details.find((detail) => detail.isCanonicalSlug);

  return exactCanonicalMatch ?? details[0];
});
