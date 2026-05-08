import { notFound } from 'next/navigation';

import { ProductDetailsPageContent } from '@/components/product-details';

import { getIdFromSlugId } from '@/lib/routes';
import { buildProductPath } from '@/lib/routes/product-routes';
import { createPageMetadata } from '@/lib/seo';

import { getProductDetails, getProductReviews } from '@/services';

import type { Metadata } from 'next';

//===================================================================

type ProductDetailsPageProps = {
  params: Promise<{
    productSlug: string;
  }>;
  searchParams?: Promise<{
    storeId?: string;
  }>;
};

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const productId = getIdFromSlugId(productSlug);

  if (!productId) {
    return createPageMetadata({
      title: 'Product Not Found',
      description: 'The requested medicine could not be found.',
      path: `/${productSlug}`,
      noIndex: true,
    });
  }

  const productData = await getProductDetails(productId).catch(() => null);
  const product = productData?.product;

  if (!product) {
    return createPageMetadata({
      title: 'Product Not Found',
      description: 'The requested medicine could not be found.',
      path: `/${productSlug}`,
      noIndex: true,
    });
  }

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

async function ProductDetailsPage({
  params,
  searchParams,
}: ProductDetailsPageProps) {
  const { productSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const productId = getIdFromSlugId(productSlug);

  if (!productId) notFound();

  const [productData, reviewsData] = await Promise.all([
    getProductDetails(productId).catch(() => null),
    getProductReviews(productId).catch(() => null),
  ]);

  if (!productData?.product) notFound();

  return (
    <ProductDetailsPageContent
      product={productData.product}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? 0}
      contextStoreId={resolvedSearchParams?.storeId}
      areReviewsUnavailable={!reviewsData}
    />
  );
}

export default ProductDetailsPage;
