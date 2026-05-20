import { StoreDetailsPageContent } from '@/components/pharmacy-stores';

import { buildStorePath, getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { getStoreDetails, getStoreReviews } from '@/services';

import type { Metadata } from 'next';
import type { Store } from '@/types';

//===================================================================

export async function getStoreBySlugId(slugId: string): Promise<Store | null> {
  const storeId = getIdFromSlugId(slugId);

  if (!storeId) return null;

  const storeData = await getStoreDetails(storeId).catch(() => null);

  return storeData?.store ?? null;
}

//===================================================================

export function createStoreDetailMetadata(store: Store): Metadata {
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

//===================================================================

export async function renderStoreDetailPage(store: Store) {
  const reviewsData = await getStoreReviews(store.id).catch(() => null);

  return (
    <StoreDetailsPageContent
      store={store}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? store.reviewsCount ?? 0}
      areReviewsUnavailable={!reviewsData}
    />
  );
}
