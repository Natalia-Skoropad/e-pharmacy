import { Container, Pagination } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MedicinesCatalogFiltersForm from '@/components/medicine-store/MedicinesCatalogFiltersForm';
import ProductsList from '@/components/medicine-store/ProductsList';

import {
  getMedicinesCatalogDescription,
  getMedicinesCatalogTitle,
  shouldShowMedicinesCatalogSeoText,
  type MedicinesCatalogFilters,
} from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@/lib/constants/routes';

import type { Product, Store } from '@/types';

import css from './MedicineStorePageContent.module.css';

//===================================================================

type MedicineStorePageContentProps = {
  products: Product[];
  stores: Store[];
  total: number;
  totalPages: number;
  filters: MedicinesCatalogFilters;
  isUnavailable?: boolean;
};

//===================================================================

function buildCatalogHref(filters: MedicinesCatalogFilters, page: number) {
  const searchParams = new URLSearchParams();

  if (filters.storeId) searchParams.set('storeId', filters.storeId);
  if (filters.name) searchParams.set('name', filters.name);
  if (filters.article) searchParams.set('article', filters.article);
  if (filters.category !== 'all')
    searchParams.set('category', filters.category);
  if (filters.availability !== 'all') {
    searchParams.set('availability', filters.availability);
  }
  if (filters.sort !== 'newest') searchParams.set('sort', filters.sort);
  if (page > 1) searchParams.set('page', String(page));

  const queryString = searchParams.toString();

  return queryString
    ? `${ROUTES.MEDICINES_CATALOG}?${queryString}`
    : ROUTES.MEDICINES_CATALOG;
}

//===================================================================

function MedicineStorePageContent({
  products,
  stores,
  total,
  totalPages,
  filters,
  isUnavailable = false,
}: MedicineStorePageContentProps) {
  const productsCountLabel = total === 1 ? '1 product' : `${total} products`;
  const pageTitle = getMedicinesCatalogTitle(filters);
  const pageDescription = getMedicinesCatalogDescription(filters);
  const showSeoText = shouldShowMedicinesCatalogSeoText(filters);

  return (
    <main className={css.page}>
      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <Breadcrumbs
            items={[{ label: 'Home', href: ROUTES.HOME }, { label: pageTitle }]}
          />

          <div className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id="products-title">
              {pageTitle}
            </h1>
          </div>

          <MedicinesCatalogFiltersForm
            filters={filters}
            stores={stores}
            productsCountLabel={productsCountLabel}
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
            getPageHref={(page) => buildCatalogHref(filters, page)}
            ariaLabel="Medicines catalog pagination"
          />

          {showSeoText ? (
            <p className={css.sectionText}>{pageDescription}</p>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default MedicineStorePageContent;
