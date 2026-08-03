import { LinkPagination } from '@e-pharmacy/ui/navigation';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';

import type {
  ProductCardSummary,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import type { ResourceState } from '@/lib/api/resource-state';
import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

import {
  buildProductCatalogPath,
  getProductCatalogSeoContent,
  getProductCatalogTitle,
  shouldShowProductCatalogSeoText,
  type ProductCatalogFilters,
  type ProductCatalogSeoContext,
} from '@/lib/catalog/product-catalog';

import { ROUTES } from '@/lib/routes';

import CatalogPageShell from '@/components/catalog/CatalogPageShell/CatalogPageShell';
import CatalogResourceStateView from '@/components/catalog/CatalogResourceState/CatalogResourceState';
import CatalogSeoCard from '@/components/catalog/CatalogSeoCard/CatalogSeoCard';
import ProductCatalogFiltersForm from '@/components/product-catalog/ProductCatalogFiltersForm/ProductCatalogFiltersForm';
import ProductsList from '@/components/product-catalog/ProductsList/ProductsList';

//===================================================================

export type ProductCatalogPageContentProps = Readonly<{
  products: readonly ProductCardSummary[];
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  resourceState: CatalogResourceState;
  pharmacyOptionsState: ResourceState;
  filtersState: ResourceState;
}>;

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
  resourceState,
  pharmacyOptionsState,
  filtersState,
}: ProductCatalogPageContentProps) {
  const seoContext = createSeoContext(filters, pharmacies, filterOptions);
  const pageTitle = getProductCatalogTitle(filters, seoContext);
  const showSeoText = total > 0 && shouldShowProductCatalogSeoText(filters);
  const seoContent = getProductCatalogSeoContent(filters, seoContext);

  const emptyIsFiltered =
    resourceState.status === 'empty' && resourceState.reason === 'no-matches';

  const notices =
    pharmacyOptionsState.status === 'unavailable' ||
    filtersState.status === 'unavailable' ? (
      <div role="status">
        Some catalog filters are temporarily unavailable. Product results remain
        available with fallback filter options.
      </div>
    ) : undefined;

  return (
    <CatalogPageShell
      title={pageTitle}
      titleId="products-title"
      breadcrumbs={[
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },
        ...(filters.category !== 'all' && seoContext.categoryLabel
          ? [{ label: seoContext.categoryLabel }]
          : []),
        ...(filters.pharmacyId && seoContext.pharmacyName
          ? [{ label: seoContext.pharmacyName }]
          : []),
      ]}
      filters={
        <ProductCatalogFiltersForm
          filters={filters}
          pharmacies={pharmacies}
          filterOptions={filterOptions}
          visibleProductsCount={products.length}
          productsCount={total}
        />
      }
      notices={notices}
      results={
        <CatalogResourceStateView
          state={resourceState}
          emptyTitle={
            emptyIsFiltered ? 'No matching products' : 'No products available'
          }
          emptyMessage={
            emptyIsFiltered
              ? 'No products match the selected filters. Try changing or resetting the filters.'
              : 'No products are available in the catalog yet.'
          }
          unavailableMessage="Products are temporarily unavailable. Please try again later."
        >
          <ProductsList products={products} />
        </CatalogResourceStateView>
      }
      pagination={
        resourceState.status === 'success' && totalPages > 1 ? (
          <LinkPagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) =>
              buildProductsPageHref(filters, page, pharmacies)
            }
            ariaLabel="Product catalog pagination"
          />
        ) : undefined
      }
      seo={
        showSeoText ? (
          <CatalogSeoCard
            title="Compare pharmacy offers in one place"
            titleId="catalog-seo-title"
          >
            <p>{seoContent.intro}</p>
            <p>{seoContent.comparison}</p>
            <p>{seoContent.ordering}</p>
          </CatalogSeoCard>
        ) : undefined
      }
    />
  );
}

export default ProductCatalogPageContent;
