import { Container, Pagination } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import MedicinesCatalogFiltersForm from '@/components/medicines-catalog/MedicinesCatalogFiltersForm';
import ProductsList from '@/components/medicines-catalog/ProductsList';

import {
  buildMedicinesCatalogPath,
  getMedicinesCatalogDescription,
  getMedicinesCatalogSeoTextParts,
  getMedicinesCatalogTitle,
  shouldShowMedicinesCatalogSeoText,
  type MedicinesCatalogFilters,
  type MedicinesCatalogSeoContext,
} from '@/lib/catalog/medicines-catalog';

import { ROUTES } from '@e-pharmacy/config/routes';
import type { Product, ProductFilterOptionsResponse, Store } from '@e-pharmacy/types';

import css from './MedicinesCatalogPageContent.module.css';

//===================================================================

type MedicineStorePageContentProps = {
  products: Product[];
  stores: Store[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: MedicinesCatalogFilters;
  isUnavailable?: boolean;
};

//===================================================================

function buildMedicinesPageHref(
  filters: MedicinesCatalogFilters,
  page: number,
  stores: Store[]
) {
  return buildMedicinesCatalogPath({ ...filters, page }, stores);
}

//===================================================================

function createSeoContext(
  filters: MedicinesCatalogFilters,
  stores: Store[],
  filterOptions: ProductFilterOptionsResponse
): MedicinesCatalogSeoContext {
  const selectedStore = filters.storeId
    ? stores.find((store) => store.id === filters.storeId)
    : undefined;
  const selectedCategory = filterOptions.categories.find(
    (option) => option.value === filters.category
  );

  return {
    ...(selectedStore ? { storeName: selectedStore.name } : {}),
    ...(selectedCategory ? { categoryLabel: selectedCategory.label } : {}),
  };
}

//===================================================================

function MedicineStorePageContent({
  products,
  stores,
  filterOptions,
  total,
  totalPages,
  filters,
  isUnavailable = false,
}: MedicineStorePageContentProps) {
  const seoContext = createSeoContext(filters, stores, filterOptions);
  const pageTitle = getMedicinesCatalogTitle(filters, seoContext);
  const pageDescription = getMedicinesCatalogDescription(filters, seoContext);
  const showSeoText = total > 0 && shouldShowMedicinesCatalogSeoText(filters);
  const seoTextParts = getMedicinesCatalogSeoTextParts(filters, seoContext);

  return (
    <main className={css.page}>
      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Medicines catalog', href: ROUTES.MEDICINES_CATALOG },
              ...(filters.category !== 'all' && seoContext.categoryLabel
                ? [{ label: seoContext.categoryLabel }]
                : []),
              ...(filters.storeId && seoContext.storeName
                ? [{ label: seoContext.storeName }]
                : []),
            ]}
            includeStructuredData={showSeoText}
          />

          <div className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id="products-title">
              {pageTitle}
            </h1>
          </div>

          <MedicinesCatalogFiltersForm
            filters={filters}
            stores={stores}
            filterOptions={filterOptions}
            visibleProductsCount={products.length}
            productsCount={total}
          />

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Medicines are temporarily unavailable. Please check that the
              backend API is running.
            </div>
          ) : null}

          <ProductsList products={products} />

          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) => buildMedicinesPageHref(filters, page, stores)}
            ariaLabel="Medicines catalog pagination"
          />

          {showSeoText ? (
            <section
              className={css.seoCard}
              aria-labelledby="catalog-seo-title"
            >
              <h2 className={css.seoTitle} id="catalog-seo-title">
                Compare trusted pharmacy offers in one place
              </h2>

              <p className={css.sectionText}>
                {seoTextParts[0]}{' '}
                <strong className={css.seoAccent}>{seoTextParts[1]}</strong>{' '}
                {seoTextParts[2]}{' '}
                <strong className={css.seoAccent}>{seoTextParts[3]}</strong>,{' '}
                {seoTextParts[4]}
              </p>

              <p className="visually-hidden">{pageDescription}</p>
            </section>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default MedicineStorePageContent;
