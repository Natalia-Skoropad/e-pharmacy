import 'server-only';
import { cache } from 'react';

import { isReservedRootSlug } from '@/lib/routes';

import { buildSlugId } from '@e-pharmacy/validation/shared';
import { buildProductPath, buildPharmacyPath } from '@/lib/routes';

import { lookupProductBySlugId } from '@/lib/details/server/product-detail-page';
import { lookupPharmacyBySlugId } from '@/lib/details/server/pharmacy-detail-page';

import type { Product, Pharmacy } from '@e-pharmacy/types';
import type { DataUnavailableReason } from '@/lib/api/server';

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

export type RootDetailResolveResult =
  | { status: 'found'; detail: RootDetail }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: DataUnavailableReason };

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
): Promise<RootDetailResolveResult> {
  if (isReservedRootSlug(slugId)) return { status: 'not_found' };

  const [productResult, pharmacyResult] = await Promise.all([
    lookupProductBySlugId(slugId),
    lookupPharmacyBySlugId(slugId),
  ]);

  const details = [
    productResult.status === 'found'
      ? createProductRootDetail(slugId, productResult.product)
      : null,
    pharmacyResult.status === 'found'
      ? createPharmacyRootDetail(slugId, pharmacyResult.pharmacy)
      : null,
  ].filter((detail): detail is RootDetail => Boolean(detail));

  if (details.length > 0) {
    const exactCanonicalMatch = details.find((detail) => detail.isCanonicalSlug);

    if (exactCanonicalMatch) {
      return { status: 'found', detail: exactCanonicalMatch };
    }

    if (details.length === 1) {
      return { status: 'found', detail: details[0] };
    }

    return { status: 'not_found' };
  }

  if (productResult.status === 'unavailable') {
    return { status: 'unavailable', reason: productResult.reason };
  }

  if (pharmacyResult.status === 'unavailable') {
    return { status: 'unavailable', reason: pharmacyResult.reason };
  }

  return { status: 'not_found' };
});
