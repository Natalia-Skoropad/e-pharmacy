import { Container, Pagination } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MedicinesCatalogFiltersForm from '@/components/medicine-store/MedicinesCatalogFiltersForm';
import ProductsList from '@/components/medicine-store/ProductsList';

import {
  MEDICINES_CATALOG_DESCRIPTION,
  MEDICINES_CATALOG_TITLE,
} from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import type { MedicinesCatalogFilters } from '@/lib/catalog/medicines-catalog';

import type { Product } from '@/types';

import css from './MedicineStorePageContent.module.css';

//===================================================================

type MedicineStorePageContentProps = {
  products: Product[];
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
  if (filters.category !== 'all') searchParams.set('category', filters.category);
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
  total,
  totalPages,
  filters,
  isUnavailable = false,
}: MedicineStorePageContentProps) {
  const productsCountLabel = total === 1 ? '1 product' : `${total} products`;

  return (
    <main className={css.page}>
      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Medicines catalog' },
            ]}
          />

          <div className={css.sectionHeader}>
            <div>
              <p className={css.sectionKicker}>Medicines catalog</p>

              <h1 className={css.sectionTitle} id="products-title">
                {MEDICINES_CATALOG_TITLE}
              </h1>

              <p className={css.sectionText}>{MEDICINES_CATALOG_DESCRIPTION}</p>
            </div>

            <p className={css.resultCount}>{productsCountLabel}</p>
          </div>

          <MedicinesCatalogFiltersForm filters={filters} />

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
        </Container>
      </section>
    </main>
  );
}

export default MedicineStorePageContent;
