import { ProductDetailsPageContent } from '@/components/medicines-catalog';

import { buildProductPath, getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { getProductDetails, getProductReviews } from '@/services';

import type { Metadata } from 'next';
import type { Product } from '@/types';

//===================================================================

type ProductDetailSearchParams = {
  storeId?: string;
};

//===================================================================

export async function getProductBySlugId(
  slugId: string
): Promise<Product | null> {
  const productId = getIdFromSlugId(slugId);

  if (!productId) return null;

  const productData = await getProductDetails(productId).catch(() => null);

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
  const reviewsData = await getProductReviews(product.id).catch(() => null);

  return (
    <ProductDetailsPageContent
      product={product}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? 0}
      contextStoreId={searchParams?.storeId}
      areReviewsUnavailable={!reviewsData}
    />
  );
}
