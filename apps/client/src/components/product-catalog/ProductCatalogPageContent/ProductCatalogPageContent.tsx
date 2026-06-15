import { Container, Pagination } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import ProductCatalogFiltersForm from '@/components/product-catalog/ProductCatalogFiltersForm';
import ProductsList from '@/components/product-catalog/ProductsList';

import {
  buildProductCatalogPath,
  getProductCatalogDescription,
  getProductCatalogSeoTextParts,
  getProductCatalogTitle,
  shouldShowProductCatalogSeoText,
  type ProductCatalogFilters,
  type ProductCatalogSeoContext,
} from '@/lib/catalog/product-catalog';

import { ROUTES } from '@e-pharmacy/config/routes';
import type {
  Product,
  ProductFilterOptionsResponse,
  Pharmacy,
} from '@e-pharmacy/types';

import css from './ProductCatalogPageContent.module.css';

//===================================================================

type ProductCatalogPageContentProps = {
  products: Product[];
  pharmacies: Pharmacy[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  isUnavailable?: boolean;
};

//===================================================================

function buildProductsPageHref(
  filters: ProductCatalogFilters,
  page: number,
  pharmacies: Pharmacy[]
) {
  return buildProductCatalogPath({ ...filters, page }, pharmacies);
}

//===================================================================

function createSeoContext(
  filters: ProductCatalogFilters,
  pharmacies: Pharmacy[],
  filterOptions: ProductFilterOptionsResponse
): ProductCatalogSeoContext {
  const selectedPharmacy = filters.pharmacyId
    ? pharmacies.find((pharmacy) => pharmacy.id === filters.pharmacyId)
    : undefined;
  const selectedCategory = filterOptions.categories.find(
    (option) => option.value === filters.category
  );

  return {
    ...(selectedPharmacy ? { pharmacyName: selectedPharmacy.name } : {}),
    ...(selectedCategory ? { categoryLabel: selectedCategory.label } : {}),
  };
}

//===================================================================

function ProductCatalogPageContent({
  products,
  pharmacies,
  filterOptions,
  total,
  totalPages,
  filters,
  isUnavailable = false,
}: ProductCatalogPageContentProps) {
  const seoContext = createSeoContext(filters, pharmacies, filterOptions);
  const pageTitle = getProductCatalogTitle(filters, seoContext);
  const pageDescription = getProductCatalogDescription(filters, seoContext);
  const showSeoText = total > 0 && shouldShowProductCatalogSeoText(filters);
  const seoTextParts = getProductCatalogSeoTextParts(filters, seoContext);

  return (
    <main className={css.page}>
      <section className={css.productsSection} aria-labelledby="products-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },
              ...(filters.category !== 'all' && seoContext.categoryLabel
                ? [{ label: seoContext.categoryLabel }]
                : []),
              ...(filters.pharmacyId && seoContext.pharmacyName
                ? [{ label: seoContext.pharmacyName }]
                : []),
            ]}
            includeStructuredData={showSeoText}
          />

          <div className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id="products-title">
              {pageTitle}
            </h1>
          </div>

          <ProductCatalogFiltersForm
            filters={filters}
            pharmacies={pharmacies}
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
            getPageHref={(page) =>
              buildProductsPageHref(filters, page, pharmacies)
            }
            ariaLabel="Product catalog pagination"
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

export default ProductCatalogPageContent;
