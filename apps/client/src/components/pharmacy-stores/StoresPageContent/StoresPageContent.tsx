import { Container, Pagination } from '@e-pharmacy/ui/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StoresList from '@/components/pharmacy-stores/StoresList';
import { StoresCatalogFiltersForm } from '@/components/pharmacy-stores/StoresCatalogFiltersForm';

import {
  buildPharmacyStoresPath,
  getPharmacyStoresDescription,
  getPharmacyStoresSeoTextParts,
  getPharmacyStoresTitle,
  shouldShowPharmacyStoresSeoText,
  type PharmacyStoresFilters,
} from '@/lib/catalog/pharmacy-stores-catalog';

import { ROUTES } from '@/lib/constants/routes';
import type { Store } from '@/types';

import css from './StoresPageContent.module.css';

//===================================================================

type StoresPageContentProps = {
  stores: Store[];
  total: number;
  totalPages: number;
  filters: PharmacyStoresFilters;
  cityOptions: string[];
  isUnavailable?: boolean;
};

//===================================================================

function buildStoresHref(filters: PharmacyStoresFilters, page: number) {
  return buildPharmacyStoresPath({ ...filters, page });
}

//===================================================================

function StoresPageContent({
  stores,
  total,
  totalPages,
  filters,
  cityOptions,
  isUnavailable = false,
}: StoresPageContentProps) {
  const storesCountLabel = total === 1 ? '1 store' : `${total} stores`;
  const pageTitle = getPharmacyStoresTitle(filters);
  const pageDescription = getPharmacyStoresDescription(filters);
  const showSeoText = total > 0 && shouldShowPharmacyStoresSeoText(filters);
  const seoTextParts = getPharmacyStoresSeoTextParts(filters);

  return (
    <main className={css.page}>
      <section className={css.storesSection} aria-labelledby="stores-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacy stores', href: ROUTES.STORES },
              ...(filters.city ? [{ label: filters.city }] : []),
            ]}
            includeStructuredData={showSeoText}
          />

          <div className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id="stores-title">
              {pageTitle}
            </h1>
          </div>

          <StoresCatalogFiltersForm
            filters={filters}
            cityOptions={cityOptions}
            storesCountLabel={storesCountLabel}
          />

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Stores are temporarily unavailable. Please check that the backend
              API is running.
            </div>
          ) : null}

          <StoresList stores={stores} />

          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) => buildStoresHref(filters, page)}
            ariaLabel="Pharmacy stores pagination"
          />

          {showSeoText ? (
            <section className={css.seoCard} aria-labelledby="stores-seo-title">
              <h2 className={css.seoTitle} id="stores-seo-title">
                Choose a trusted pharmacy before you order
              </h2>

              <p className={css.sectionText}>
                {seoTextParts[0]}{' '}
                <strong className={css.seoAccent}>{seoTextParts[1]}</strong>{' '}
                {seoTextParts[2]}
              </p>

              <p className="visually-hidden">{pageDescription}</p>
            </section>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default StoresPageContent;
