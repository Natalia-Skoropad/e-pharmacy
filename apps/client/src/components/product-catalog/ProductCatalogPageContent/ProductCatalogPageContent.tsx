import type { ReactNode } from 'react';

import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';
import { LinkPagination } from '@e-pharmacy/ui/navigation';

import type {
  ProductCardSummary,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import type { ResourceState } from '@/lib/api/resource-state';
import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

import {
  buildProductCatalogPath,
  getProductCatalogSeoContent,
  getProductCatalogSeoParts,
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
  availableCategories: ProductFilterOptionsResponse['categories'];
  total: number;
  totalPages: number;
  filters: ProductCatalogFilters;
  selectedProductName?: string;
  selectedProductImageUrl?: string;
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
  filterOptions: ProductFilterOptionsResponse,
  selectedProductName?: string
): ProductCatalogSeoContext {
  const selectedPharmacy = filters.pharmacyId
    ? pharmacies.find((pharmacy) => pharmacy.id === filters.pharmacyId)
    : undefined;

  const selectedCategory = filterOptions.categories.find(
    (option) => option.value === filters.category
  );

  return {
    ...(selectedPharmacy ? { pharmacyName: selectedPharmacy.name } : {}),
    ...(selectedProductName ? { productName: selectedProductName } : {}),
    ...(selectedCategory ? { categoryLabel: selectedCategory.label } : {}),
  };
}

//===================================================================

/** Highlight the named product, pharmacy and category in user-visible SEO text. */
function highlightSeoEntities(
  text: string,
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext
): ReactNode {
  return getProductCatalogSeoParts(text, filters, context).map((part, index) =>
    part.highlighted ? <strong key={index}>{part.text}</strong> : part.text
  );
}

//===================================================================

function ProductCatalogPageContent({
  products,
  pharmacies,
  filterOptions,
  availableCategories,
  total,
  totalPages,
  filters,
  resourceState,
  selectedProductName,
  selectedProductImageUrl,
}: ProductCatalogPageContentProps) {
  const seoContext = createSeoContext(
    filters,
    pharmacies,
    filterOptions,
    selectedProductName
  );

  const pageTitle = getProductCatalogTitle(filters, seoContext);

  const showSeoText =
    (total > 0 || Boolean(filters.productId && selectedProductName)) &&
    shouldShowProductCatalogSeoText(filters);

  const seoContent = getProductCatalogSeoContent(filters, seoContext);

  const emptyIsFiltered =
    resourceState.status === 'empty' && resourceState.reason === 'no-matches';

  const notices = undefined;

  return (
    <CatalogPageShell
      title={pageTitle}
      titleId="products-title"
      breadcrumbs={[
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },

        ...(filters.category !== 'all' && seoContext.categoryLabel
          ? [
              {
                label: seoContext.categoryLabel,
                ...(filters.pharmacyId || filters.productId
                  ? {
                      href: buildProductCatalogPath({
                        category: filters.category,
                      }),
                    }
                  : {}),
              },
            ]
          : []),

        ...(filters.pharmacyId && seoContext.pharmacyName
          ? [
              {
                label: seoContext.pharmacyName,
                ...(filters.productId
                  ? {
                      href: buildProductCatalogPath(
                        {
                          category: filters.category,
                          pharmacyId: filters.pharmacyId,
                        },
                        pharmacies
                      ),
                    }
                  : {}),
              },
            ]
          : []),

        ...(filters.productId && seoContext.productName
          ? [{ label: seoContext.productName }]
          : []),
      ]}
      filters={
        <ProductCatalogFiltersForm
          filters={filters}
          pharmacies={pharmacies}
          filterOptions={filterOptions}
          availableCategories={availableCategories}
          selectedProductName={selectedProductName}
          selectedProductImageUrl={selectedProductImageUrl}
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
          unavailableMessage="Products are loading."
          recoveryLabel="products"
          skeletonVariant="product"
          emptyVariant="resource"
        >
          <ProductsList
            products={products}
            pharmacyId={filters.pharmacyId}
            pharmacyName={seoContext.pharmacyName}
          />
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
            <p>{highlightSeoEntities(seoContent.intro, filters, seoContext)}</p>
            <p>
              {highlightSeoEntities(seoContent.comparison, filters, seoContext)}
            </p>
            <p>
              {highlightSeoEntities(seoContent.ordering, filters, seoContext)}
            </p>
          </CatalogSeoCard>
        ) : undefined
      }
    />
  );
}

export default ProductCatalogPageContent;
