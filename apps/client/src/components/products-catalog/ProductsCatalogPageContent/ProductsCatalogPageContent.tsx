import { Container, Pagination } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import ProductsCatalogFiltersForm from '@/components/products-catalog/ProductsCatalogFiltersForm';
import ProductsList from '@/components/products-catalog/ProductsList';

import {
  buildProductsCatalogPath,
  getProductsCatalogDescription,
  getProductsCatalogSeoTextParts,
  getProductsCatalogTitle,
  shouldShowProductsCatalogSeoText,
  type ProductsCatalogFilters,
  type ProductsCatalogSeoContext,
} from '@/lib/catalog/products-catalog';

import { ROUTES } from '@e-pharmacy/config/routes';
import type {
  Product,
  ProductFilterOptionsResponse,
  Store,
} from '@e-pharmacy/types';

import css from './ProductsCatalogPageContent.module.css';

//===================================================================

type ProductStorePageContentProps = {
  products: Product[];
  stores: Store[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductsCatalogFilters;
  isUnavailable?: boolean;
};

//===================================================================

function buildProductsPageHref(
  filters: ProductsCatalogFilters,
  page: number,
  stores: Store[]
) {
  return buildProductsCatalogPath({ ...filters, page }, stores);
}

//===================================================================

function createSeoContext(
  filters: ProductsCatalogFilters,
  stores: Store[],
  filterOptions: ProductFilterOptionsResponse
): ProductsCatalogSeoContext {
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

function ProductStorePageContent({
  products,
  stores,
  filterOptions,
  total,
  totalPages,
  filters,
  isUnavailable = false,
}: ProductStorePageContentProps) {
  const seoContext = createSeoContext(filters, stores, filterOptions);
  const pageTitle = getProductsCatalogTitle(filters, seoContext);
  const pageDescription = getProductsCatalogDescription(filters, seoContext);
  const showSeoText = total > 0 && shouldShowProductsCatalogSeoText(filters);
  const seoTextParts = getProductsCatalogSeoTextParts(filters, seoContext);

  return (
    <main className={css.page}>
      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Products catalog', href: ROUTES.PRODUCTS_CATALOG },
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

          <ProductsCatalogFiltersForm
            filters={filters}
            stores={stores}
            filterOptions={filterOptions}
            visibleProductsCount={products.length}
            productsCount={total}
          />

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Products are temporarily unavailable. Please check that the
              backend API is running.
            </div>
          ) : null}

          <ProductsList products={products} />

          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) => buildProductsPageHref(filters, page, stores)}
            ariaLabel="Products catalog pagination"
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

export default ProductStorePageContent;
