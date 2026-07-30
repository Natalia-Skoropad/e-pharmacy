import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { LinkPagination } from '@e-pharmacy/ui/navigation';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import type {
  ProductDetails,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import type { ResourceState } from '@/lib/api/resource-state';

import {
  buildProductCatalogPath,
  getProductCatalogDescription,
  getProductCatalogSeoTextParts,
  getProductCatalogTitle,
  shouldShowProductCatalogSeoText,
  type ProductCatalogFilters,
  type ProductCatalogSeoContext,
} from '@/lib/catalog/product-catalog';

import { ROUTES } from '@/lib/routes';

import ProductsList from '@/components/product-catalog/ProductsList';
import ProductCatalogFiltersForm from '@/components/product-catalog/ProductCatalogFiltersForm';

import css from './ProductCatalogPageContent.module.css';

//===================================================================

type ProductCatalogPageContentProps = {
  products: ProductDetails[];
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  catalogState: ResourceState;
  pharmacyOptionsState: ResourceState;
  filtersState: ResourceState;
};

//===================================================================

function buildProductsPageHref(
  filters: ProductCatalogFilters,
  page: number,
  pharmacies: PharmacyOption[]
) {
  return buildProductCatalogPath({ ...filters, page }, pharmacies);
}

//===================================================================

function createSeoContext(
  filters: ProductCatalogFilters,
  pharmacies: PharmacyOption[],
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
  catalogState,
  pharmacyOptionsState,
  filtersState,
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
              {
                label: 'Product catalog',
                href: ROUTES.PRODUCTS_CATALOG,
              },
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

          {catalogState.status === 'unavailable' ? (
            <div className={css.notice} role="status">
              Products are temporarily unavailable. Please check that the
              backend API is running.
            </div>
          ) : null}

          {pharmacyOptionsState.status === 'unavailable' ||
          filtersState.status === 'unavailable' ? (
            <div className={css.notice} role="status">
              Some catalog filters are temporarily unavailable. Product
              results remain available with fallback filter options.
            </div>
          ) : null}

          <ProductsList products={products} />

          <LinkPagination
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
