import { notFound } from 'next/navigation';

import { StoreDetailsPageContent } from '@/components/pharmacy-stores';
import { ProductDetailsPageContent } from '@/components/product-details';

import { getIdFromSlugId } from '@/lib/routes';
import { buildProductPath, buildStorePath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import {
  getProductDetails,
  getProductReviews,
  getStoreDetails,
  getStoreReviews,
} from '@/services';

import type { Metadata } from 'next';

//===================================================================

type DetailsPageProps = {
  params: Promise<{
    slug: string;
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
}: DetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entityId = getIdFromSlugId(slug);

  if (!entityId) {
    return createPageMetadata({
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
      path: `/${slug}`,
      noIndex: true,
    });
  }

  const productData = await getProductDetails(entityId).catch(() => null);
  const product = productData?.product;

  if (product) {
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

  const storeData = await getStoreDetails(entityId).catch(() => null);
  const store = storeData?.store;

  if (store) {
    return createPageMetadata({
      title: `${store.name} pharmacy details`,
      description:
        store.description ??
        `View ${store.name} address, phone number, email, working hours, rating, reviews, and available medicines on E-PHARMACY.`,
      path: buildStorePath(store.name, store.id),
      image: store.imageUrl,
      imageAlt: `${store.name} pharmacy storefront`,
    });
  }

  return createPageMetadata({
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
    path: `/${slug}`,
    noIndex: true,
  });
}

//===================================================================

async function DetailsPage({ params, searchParams }: DetailsPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entityId = getIdFromSlugId(slug);

  if (!entityId) notFound();

  const productData = await getProductDetails(entityId).catch(() => null);

  if (productData?.product) {
    const reviewsData = await getProductReviews(entityId).catch(() => null);

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

  const storeData = await getStoreDetails(entityId).catch(() => null);

  if (!storeData?.store) notFound();

  const reviewsData = await getStoreReviews(entityId).catch(() => null);

  return (
    <StoreDetailsPageContent
      store={storeData.store}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? storeData.store.reviewsCount ?? 0}
      areReviewsUnavailable={!reviewsData}
    />
  );
}

export default DetailsPage;
