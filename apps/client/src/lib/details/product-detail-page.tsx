import type { Metadata } from 'next';

import { ProductDetailsPageContent } from '@/components/product-catalog';
import { buildProductPath, getIdFromSlugId } from '@e-pharmacy/config/routes';
import { PUBLIC_API_CACHE_OPTIONS } from '@e-pharmacy/api-client/core';
import { createPageMetadata } from '@/lib/seo';

import {
  getProductDetails,
  getProductReviews,
} from '@e-pharmacy/api-client/client';

import type { Product } from '@e-pharmacy/types';

//===================================================================

type ProductDetailSearchParams = {
  pharmacyId?: string;
};

//===================================================================

export async function getProductBySlugId(
  slugId: string
): Promise<Product | null> {
  const productId = getIdFromSlugId(slugId);

  if (!productId) return null;

  const productData = await getProductDetails(
    productId,
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return productData?.product ?? null;
}

//===================================================================

export function createProductDetailMetadata(product: Product): Metadata {
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
  product: Product,
  searchParams?: ProductDetailSearchParams
) {
  const reviewsData = await getProductReviews(
    product.id,
    PUBLIC_API_CACHE_OPTIONS
  ).catch(() => null);

  return (
    <ProductDetailsPageContent
      product={product}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? 0}
      contextPharmacyId={searchParams?.pharmacyId}
      areReviewsUnavailable={!reviewsData}
    />
  );
}
