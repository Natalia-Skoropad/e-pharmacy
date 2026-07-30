import 'server-only';

import type { ProductDetails } from '@e-pharmacy/types/products';

import {
  getProductReviews,
  PUBLIC_API_CACHE_OPTIONS,
  resolveServerDataState,
} from '@/lib/api/server';

import ProductDetailsPageContent from '../ProductDetailsPageContent/ProductDetailsPageContent';

//===================================================================

type ProductDetailPageProps = Readonly<{
  product: ProductDetails;
  pharmacyId?: string;
}>;

//===================================================================

export async function ProductDetailPage({
  product,
  pharmacyId,
}: ProductDetailPageProps) {
  const reviewsState = await resolveServerDataState(
    getProductReviews(product.id, PUBLIC_API_CACHE_OPTIONS)
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
      reviews={[...(reviewsData?.items ?? [])]}
      reviewsTotal={reviewsData?.total ?? 0}
      contextPharmacyId={pharmacyId}
      areReviewsUnavailable={reviewsState.status === 'unavailable'}
    />
  );
}
