import { notFound } from 'next/navigation';

import { ProductDetailsPageContent } from '@/components/product-details';

import { buildProductPath, getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { getProductDetails, getProductReviews } from '@/services';

import type { Metadata } from 'next';
import type { Product } from '@/types';

//===================================================================

type ProductDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
  searchParams?: Promise<{
    storeId?: string;
  }>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

async function getProductBySlugId(slugId: string): Promise<Product | null> {
  const productId = getIdFromSlugId(slugId);

  if (!productId) return null;

  const productData = await getProductDetails(productId).catch(() => null);

  return productData?.product ?? null;
}

//===================================================================

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const product = await getProductBySlugId(slugId);

  if (!product) {
    return createPageMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      path: `/products/${slugId}`,
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
  const { slugId } = await params;
  const resolvedSearchParams = await searchParams;
  const product = await getProductBySlugId(slugId);

  if (!product) notFound();

  const reviewsData = await getProductReviews(product.id).catch(() => null);

  return (
    <ProductDetailsPageContent
      product={product}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? 0}
      contextStoreId={resolvedSearchParams?.storeId}
      areReviewsUnavailable={!reviewsData}
    />
  );
}

export default ProductDetailsPage;
