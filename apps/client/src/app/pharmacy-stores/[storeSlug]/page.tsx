import { notFound } from 'next/navigation';
import { MapPin, Phone, ShoppingBag, Star } from 'lucide-react';

import { ButtonLink, Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';
import { getStoreDetails } from '@/services';

import css from './page.module.css';

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

function getProductsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
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
      ? `View ${store.name} address, phone number, rating, and available medicines on E-PHARMACY.`
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

  const storeData = await getStoreDetails(storeId).catch(() => null);
  const store = storeData?.store;

  if (!store) {
    notFound();
  }
  const medicinesHref = buildMedicinesCatalogPath({ storeId: store.id }, [store]);
  const ratingLabel = store.rating ? store.rating.toFixed(1) : 'New';

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="store-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacy stores', href: ROUTES.STORES },
              { label: store.name },
            ]}
          />

          <article className={css.card}>
            <p className={css.kicker}>{store.city ?? 'Pharmacy store'}</p>

            <div className={css.header}>
              <h1 className={css.title} id="store-title">
                {store.name}
              </h1>

              <span className={css.rating} aria-label={`Store rating ${ratingLabel}`}>
                <Star size={16} aria-hidden="true" />
                {ratingLabel}
              </span>
            </div>

            <dl className={css.detailsList}>
              <div className={css.detailsItem}>
                <dt>
                  <MapPin size={18} aria-hidden="true" />
                  Address
                </dt>
                <dd>{store.address}</dd>
              </div>

              {store.phone ? (
                <div className={css.detailsItem}>
                  <dt>
                    <Phone size={18} aria-hidden="true" />
                    Phone
                  </dt>
                  <dd>
                    <a href={`tel:${store.phone}`}>{store.phone}</a>
                  </dd>
                </div>
              ) : null}

              <div className={css.detailsItem}>
                <dt>
                  <ShoppingBag size={18} aria-hidden="true" />
                  Medicines
                </dt>
                <dd>{getProductsCountLabel(store.availableProductsCount)}</dd>
              </div>
            </dl>

            <ButtonLink className={css.link} href={medicinesHref}>
              View medicines from this pharmacy
            </ButtonLink>
          </article>
        </Container>
      </section>
    </main>
  );
}

export default StoreDetailsPage;
