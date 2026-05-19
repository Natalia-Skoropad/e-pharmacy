import { notFound } from 'next/navigation';

import { StoreDetailsPageContent } from '@/components/pharmacy-stores';
import { ProductDetailsPageContent } from '@/components/product-details';

import {
  buildProductPath,
  buildStorePath,
  getIdFromSlugId,
} from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import {
  getProductDetails,
  getProductReviews,
  getStoreDetails,
  getStoreReviews,
} from '@/services';

import type { Metadata } from 'next';
import type { Product, Store } from '@/types';

//===================================================================

type DetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    storeId?: string;
  }>;
};

type ResolvedDetailsEntity =
  | {
      type: 'product';
      product: Product;
    }
  | {
      type: 'store';
      store: Store;
    }
  | null;

//===================================================================

export const revalidate = 300;

//===================================================================

function removeLeadingSlash(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

//===================================================================

function isProductCanonicalSlug(slug: string, product: Product): boolean {
  return (
    slug === removeLeadingSlash(buildProductPath(product.name, product.id))
  );
}

//===================================================================

function isStoreCanonicalSlug(slug: string, store: Store): boolean {
  return slug === removeLeadingSlash(buildStorePath(store.name, store.id));
}

//===================================================================

async function resolveDetailsEntity(
  slug: string
): Promise<ResolvedDetailsEntity> {
  const entityId = getIdFromSlugId(slug);

  if (!entityId) return null;

  const [productData, storeData] = await Promise.all([
    getProductDetails(entityId).catch(() => null),
    getStoreDetails(entityId).catch(() => null),
  ]);

  const product = productData?.product;
  const store = storeData?.store;

  if (product && isProductCanonicalSlug(slug, product)) {
    return { type: 'product', product };
  }

  if (store && isStoreCanonicalSlug(slug, store)) {
    return { type: 'store', store };
  }

  if (product && !store) {
    return { type: 'product', product };
  }

  if (store && !product) {
    return { type: 'store', store };
  }

  return null;
}

//===================================================================

export async function generateMetadata({
  params,
}: DetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = await resolveDetailsEntity(slug);

  if (entity?.type === 'product') {
    const { product } = entity;

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

  if (entity?.type === 'store') {
    const { store } = entity;

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
  const entity = await resolveDetailsEntity(slug);

  if (!entity) notFound();

  if (entity.type === 'product') {
    const reviewsData = await getProductReviews(entity.product.id).catch(
      () => null
    );

    return (
      <ProductDetailsPageContent
        product={entity.product}
        reviews={reviewsData?.items ?? []}
        reviewsTotal={reviewsData?.total ?? 0}
        contextStoreId={resolvedSearchParams?.storeId}
        areReviewsUnavailable={!reviewsData}
      />
    );
  }

  const reviewsData = await getStoreReviews(entity.store.id).catch(() => null);

  return (
    <StoreDetailsPageContent
      store={entity.store}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? entity.store.reviewsCount ?? 0}
      areReviewsUnavailable={!reviewsData}
    />
  );
}

export default DetailsPage;
