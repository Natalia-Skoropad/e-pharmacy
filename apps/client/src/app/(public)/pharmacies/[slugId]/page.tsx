import { notFound } from 'next/navigation';

import { StoreDetailsPageContent } from '@/components/pharmacy-stores';

import { buildStorePath, getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { getStoreDetails, getStoreReviews } from '@/services';

import type { Metadata } from 'next';
import type { Store } from '@/types';

//===================================================================

type PharmacyDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
};

//===================================================================

export const revalidate = 300;

//===================================================================

async function getStoreBySlugId(slugId: string): Promise<Store | null> {
  const storeId = getIdFromSlugId(slugId);

  if (!storeId) return null;

  const storeData = await getStoreDetails(storeId).catch(() => null);

  return storeData?.store ?? null;
}

//===================================================================

export async function generateMetadata({
  params,
}: PharmacyDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const store = await getStoreBySlugId(slugId);

  if (!store) {
    return createPageMetadata({
      title: 'Pharmacy Not Found',
      description: 'The requested pharmacy could not be found.',
      path: `/pharmacies/${slugId}`,
      noIndex: true,
    });
  }

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

async function PharmacyDetailsPage({ params }: PharmacyDetailsPageProps) {
  const { slugId } = await params;
  const store = await getStoreBySlugId(slugId);

  if (!store) notFound();

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

export default PharmacyDetailsPage;
