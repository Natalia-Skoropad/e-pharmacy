import 'server-only';
import { cache } from 'react';

import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';
import type { ProductDetails } from '@e-pharmacy/types/products';
import { buildSlugId } from '@e-pharmacy/validation/url';

import { isReservedRootSlug } from '@/lib/routes';
import { buildProductPath, buildPharmacyPath } from '@/lib/routes';
import { lookupProductBySlugId } from '@/lib/details/server/product-detail-page';
import { lookupPharmacyBySlugId } from '@/lib/details/server/pharmacy-detail-page';
import type { ServerDataErrorContext } from '@/lib/api/server';

import { selectRootDetail } from './root-detail-policy';

//===================================================================

type ProductRootDetail = {
  type: 'product';
  product: ProductDetails;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

type PharmacyRootDetail = {
  type: 'pharmacy';
  pharmacy: PublicPharmacy;
  canonicalPath: string;
  isCanonicalSlug: boolean;
};

//===================================================================

export type RootDetail = ProductRootDetail | PharmacyRootDetail;

//===================================================================

export type RootDetailResolveResult =
  | { status: 'found'; detail: RootDetail }
  | { status: 'not_found' }
  | ({ status: 'unavailable' } & ServerDataErrorContext);

//===================================================================

function createProductRootDetail(
  slugId: string,
  product: ProductDetails
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

function createPharmacyRootDetail(
  slugId: string,
  pharmacy: PublicPharmacy
): PharmacyRootDetail {
  const canonicalSlugId = buildSlugId(pharmacy.name, pharmacy.id);

  return {
    type: 'pharmacy',
    pharmacy,
    canonicalPath: buildPharmacyPath(pharmacy.name, pharmacy.id),
    isCanonicalSlug: slugId === canonicalSlugId,
  };
}

//===================================================================

export const resolveRootDetailBySlugId = cache(
  async function resolveRootDetailBySlugId(
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

    const selection = selectRootDetail(details);

    if (selection.status === 'collision') {
      return { status: 'not_found' };
    }

    if (selection.status === 'found') {
      return { status: 'found', detail: selection.detail };
    }

    if (productResult.status === 'unavailable') {
      console.error('Root product detail unavailable', {
        slugId,
        reason: productResult.reason,
        requestId: productResult.requestId,
        httpStatus: productResult.httpStatus,
        backendCode: productResult.backendCode,
      });
      return productResult;
    }

    if (pharmacyResult.status === 'unavailable') {
      console.error('Root pharmacy detail unavailable', {
        slugId,
        reason: pharmacyResult.reason,
        requestId: pharmacyResult.requestId,
        httpStatus: pharmacyResult.httpStatus,
        backendCode: pharmacyResult.backendCode,
      });
      return pharmacyResult;
    }

    return { status: 'not_found' };
  }
);
