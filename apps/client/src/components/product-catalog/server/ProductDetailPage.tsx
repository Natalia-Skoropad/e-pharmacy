import 'server-only';

import type { ProductDetails } from '@e-pharmacy/types/products';

import type { ProductTab } from '@/lib/routes/product-detail-tabs';

import {
  getProductReviews,
  PUBLIC_REVIEWS_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import ProductDetailsPageContent from '../ProductDetailsPageContent/ProductDetailsPageContent';

//===================================================================

type ProductDetailPageProps = Readonly<{
  product: ProductDetails;
  pharmacyId?: string;
  initialTab?: ProductTab;
}>;

//===================================================================

export async function ProductDetailPage({
  product,
  pharmacyId,
  initialTab = 'details',
}: ProductDetailPageProps) {
  const reviewsState = await resolveServerDataState(
    getProductReviews(product.id, PUBLIC_REVIEWS_CACHE_OPTIONS)
  );

  if (reviewsState.status === 'unavailable') {
    console.error('Product reviews unavailable', {
      productId: product.id,
      reason: reviewsState.reason,
      requestId: reviewsState.requestId,
      httpStatus: reviewsState.httpStatus,
    });
  }

  const reviewsData =
    reviewsState.status === 'success' ? reviewsState.data : null;

  return (
    <ProductDetailsPageContent
      product={product}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? product.reviewsCount ?? 0}
      contextPharmacyId={pharmacyId}
      initialTab={initialTab}
      areReviewsUnavailable={reviewsState.status === 'unavailable'}
    />
  );
}
