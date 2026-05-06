import { ButtonLink, Container, SvgIcon } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProductsList from '@/components/medicine-store/ProductsList';

import {
  MEDICINE_STORE_DESCRIPTION,
  MEDICINE_STORE_TITLE,
} from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';

import type { Product, Store } from '@/types';

import css from './MedicineStorePageContent.module.css';

//===================================================================

type MedicineStorePageContentProps = {
  store: Store | null;
  products: Product[];
  total: number;
  isFilteredByStore: boolean;
  isUnavailable?: boolean;
};

//===================================================================

function MedicineStorePageContent({
  store,
  products,
  total,
  isFilteredByStore,
  isUnavailable = false,
}: MedicineStorePageContentProps) {
  const title = store?.name ?? MEDICINE_STORE_TITLE;
  const description = store?.description ?? MEDICINE_STORE_DESCRIPTION;
  const productsCountLabel = total === 1 ? '1 product' : `${total} products`;

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="medicine-store-title">
        <Container>
          <Breadcrumbs
            items={
              store
                ? [
                    { label: 'Home', href: ROUTES.HOME },
                    { label: 'Pharmacy Stores', href: ROUTES.STORES },
                    { label: store.name },
                  ]
                : createBreadcrumbs(MEDICINE_STORE_TITLE)
            }
          />

          <div className={css.heroGrid}>
            <div className={css.heroContent}>
              <p className={css.kicker}>
                {store ? 'Selected pharmacy' : 'Medicine catalog'}
              </p>

              <h1 className={css.title} id="medicine-store-title">
                {title}
              </h1>

              <p className={css.text}>{description}</p>

              {store ? (
                <div className={css.storeInfo} aria-label="Pharmacy contacts">
                  <p className={css.storeInfoItem}>
                    <SvgIcon name="icon-map-pin" size={18} />
                    {store.address}
                  </p>

                  {store.phone ? (
                    <a
                      className={css.storeInfoItem}
                      href={`tel:${store.phone}`}
                    >
                      <SvgIcon name="icon-phone" size={18} />
                      {store.phone}
                    </a>
                  ) : null}
                </div>
              ) : null}

              <div className={css.actions}>
                <ButtonLink href={ROUTES.STORES} variant="secondary">
                  Choose another pharmacy
                </ButtonLink>
              </div>
            </div>

            <div className={css.summaryCard} aria-label="Products summary">
              <span className={css.summaryValue}>{productsCountLabel}</span>
              <span className={css.summaryText}>
                {store
                  ? 'available in this pharmacy'
                  : 'available in the catalog'}
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <div className={css.sectionHeader}>
            <div>
              <p className={css.sectionKicker}>
                {isFilteredByStore ? 'Store medicines' : 'All medicines'}
              </p>

              <h2 className={css.sectionTitle} id="products-title">
                Available medicines
              </h2>
            </div>

            <p className={css.resultCount}>{productsCountLabel}</p>
          </div>

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Medicines are temporarily unavailable. Please check that the
              backend API is running.
            </div>
          ) : null}

          <ProductsList products={products} />
        </Container>
      </section>
    </main>
  );
}

export default MedicineStorePageContent;
