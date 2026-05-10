import { notFound } from 'next/navigation';

import StoreDetailsPageContent from '@/components/pharmacy-stores/StoreDetailsPageContent';

import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';
import { getStoreDetails, getStoreReviews } from '@/services';

//===================================================================

type StoreDetailsPageProps = {
  params: Promise<{
    storeSlug: string;
  }>;
};

//===================================================================

function getStoreIdFromSlug(slug: string): string | null {
  const storeId = slug.match(/([a-f\d]{24})$/i)?.[1];

  return storeId ?? null;
}

//===================================================================

export const dynamic = 'force-dynamic';

//===================================================================

export async function generateMetadata({ params }: StoreDetailsPageProps) {
  const { storeSlug } = await params;
  const storeId = getStoreIdFromSlug(storeSlug);

  if (!storeId) {
    return createPageMetadata({
      title: 'Pharmacy store',
      description: 'View pharmacy store details on E-PHARMACY.',
      path: ROUTES.STORES,
      noIndex: true,
    });
  }

  const storeData = await getStoreDetails(storeId).catch(() => null);
  const store = storeData?.store;

  return createPageMetadata({
    title: store ? `${store.name} pharmacy store` : 'Pharmacy store',
    description: store
      ? `View ${store.name} address, phone number, rating, reviews, and available medicines on E-PHARMACY.`
      : 'View pharmacy store details on E-PHARMACY.',
    path: `${ROUTES.STORES}/${storeSlug}`,
    noIndex: !store,
  });
}

//===================================================================

async function StoreDetailsPage({ params }: StoreDetailsPageProps) {
  const { storeSlug } = await params;
  const storeId = getStoreIdFromSlug(storeSlug);

  if (!storeId) {
    notFound();
  }

  const [storeData, reviewsData] = await Promise.all([
    getStoreDetails(storeId).catch(() => null),
    getStoreReviews(storeId).catch(() => null),
  ]);

  const store = storeData?.store;

  if (!store) {
    notFound();
  }

  return (
    <StoreDetailsPageContent
      store={store}
      reviews={reviewsData?.items ?? []}
      reviewsTotal={reviewsData?.total ?? store.reviewsCount ?? 0}
      areReviewsUnavailable={!reviewsData}
    />
  );
}

export default StoreDetailsPage;
