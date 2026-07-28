import 'server-only';
import type { Metadata } from 'next';

import { ApiError } from '@e-pharmacy/api-client/transport';
import type { ProductDetails } from '@e-pharmacy/types/products';

import {
  getDataUnavailableReason,
  PUBLIC_API_CACHE_OPTIONS,
} from '@/lib/api/server';

import { createPageMetadata } from '@/lib/seo';
import { getProductDetails, getProductReviews } from '@/lib/api/server';
import type { DataUnavailableReason } from '@/lib/api/server';
import { buildProductPath, getIdFromSlugId } from '@/lib/routes';

import { ProductDetailsPageContent } from '@/components/product-catalog';

//===================================================================

type ProductDetailSearchParams = {
  pharmacyId?: string;
};

//===================================================================

export type ProductDetailLookupResult =
  | { status: 'found'; product: ProductDetails }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: DataUnavailableReason };

//===================================================================

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

//===================================================================

export async function lookupProductBySlugId(
  slugId: string
): Promise<ProductDetailLookupResult> {
  const productId = getIdFromSlugId(slugId);

  if (!productId) return { status: 'not_found' };

  try {
    const productData = await getProductDetails(
      productId,
      PUBLIC_API_CACHE_OPTIONS
    );

    return productData?.product
      ? { status: 'found', product: productData.product }
      : { status: 'not_found' };
  } catch (error) {
    if (isNotFoundError(error)) return { status: 'not_found' };

    return {
      status: 'unavailable',
      reason: getDataUnavailableReason(error),
    };
  }
}

//===================================================================

export async function getProductBySlugId(
  slugId: string
): Promise<ProductDetails | null> {
  const result = await lookupProductBySlugId(slugId);

  return result.status === 'found' ? result.product : null;
}

//===================================================================

export function createProductDetailMetadata(product: ProductDetails): Metadata {
  return createPageMetadata({
    title: product.name,
    description:
      product.description ??
      `Buy ${product.name} online from E-PHARMACY. Check pharmacy prices, availability, dosage, manufacturer, and product details.`,
    path: buildProductPath(product.name, product.id),
    image: product.imageUrl,
    imageAlt: product.name,
  });
}

//===================================================================

export async function renderProductDetailPage(
  product: ProductDetails,
  searchParams?: ProductDetailSearchParams
) {
  const reviewsData = await getProductReviews(
    product.id,
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return (
    <ProductDetailsPageContent
      product={product}
      reviews={[...(reviewsData?.items ?? [])]}
      reviewsTotal={reviewsData?.total ?? 0}
      contextPharmacyId={searchParams?.pharmacyId}
      areReviewsUnavailable={!reviewsData}
    />
  );
}
