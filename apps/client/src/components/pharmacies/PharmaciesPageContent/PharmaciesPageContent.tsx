import { Container, Pagination } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import PharmaciesList from '@/components/pharmacies/PharmaciesList';
import { PharmaciesCatalogFiltersForm } from '@/components/pharmacies/PharmaciesCatalogFiltersForm';

import {
  buildPharmacyPath,
  getPharmacyDescription,
  getPharmaciesSeoTextParts,
  getPharmacyTitle,
  shouldShowPharmaciesSeoText,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { ROUTES } from '@e-pharmacy/config/routes';
import type { Pharmacy } from '@e-pharmacy/types';

import css from './PharmaciesPageContent.module.css';

//===================================================================

type PharmaciesPageContentProps = {
  pharmacies: Pharmacy[];
  total: number;
  totalPages: number;
  filters: PharmacyFilters;
  cityOptions: string[];
  isUnavailable?: boolean;
};

//===================================================================

function buildPharmacyPageHref(filters: PharmacyFilters, page: number) {
  return buildPharmacyPath({ ...filters, page });
}

//===================================================================

function PharmaciesPageContent({
  pharmacies,
  total,
  totalPages,
  filters,
  cityOptions,
  isUnavailable = false,
}: PharmaciesPageContentProps) {
  const pageTitle = getPharmacyTitle(filters);
  const pageDescription = getPharmacyDescription(filters);
  const showSeoText = total > 0 && shouldShowPharmaciesSeoText(filters);
  const seoTextParts = getPharmaciesSeoTextParts(filters);

  return (
    <main className={css.page}>
      <section className={css.pharmaciesSection} aria-labelledby="pharmacies-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacies', href: ROUTES.PHARMACIES },
              ...(filters.city ? [{ label: filters.city }] : []),
            ]}
            includeStructuredData={showSeoText}
          />

          <div className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id="pharmacies-title">
              {pageTitle}
            </h1>
          </div>

          <PharmaciesCatalogFiltersForm
            filters={filters}
            cityOptions={cityOptions}
            visiblePharmaciesCount={pharmacies.length}
            pharmaciesCount={total}
          />

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Pharmacies are temporarily unavailable. Please check that the backend
              API is running.
            </div>
          ) : null}

          <PharmaciesList pharmacies={pharmacies} />

          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) => buildPharmacyPageHref(filters, page)}
            ariaLabel="Pharmacies pagination"
          />

          {showSeoText ? (
            <section className={css.seoCard} aria-labelledby="pharmacies-seo-title">
              <h2 className={css.seoTitle} id="pharmacies-seo-title">
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

export default PharmaciesPageContent;
