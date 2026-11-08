import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { PackageCheck } from 'lucide-react';

import { FiltersButton } from '@e-pharmacy/ui/primitives';
import { CountLabel, DataTable } from '@e-pharmacy/ui/data-display';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import {
  RowsPerPageSelect,
  type RowsPerPageValue,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';

import type { PharmacyClientPurchasedProduct } from '@/lib/clients/clients';
import { getPharmacyClientProducts } from '@/lib/api/browser/clients.api';

import {
  OwnerProductSearch,
  type ProductSuggestionsLoader,
} from '@/components/all-products/OwnerProductSearch/OwnerProductSearch';

import { PRODUCT_ROWS_PER_PAGE_OPTIONS } from './ClientDetailFilters';
import { buildClientProductColumns } from './ClientDetailTableColumns';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ProductsTabProps = Readonly<{
  clientId: string;

  categoryOptions: readonly (SelectOption<string> & {
    icon?: string;
    categoryId?: string;
  })[];

  productId: string;
  onProductIdChange: (id: string) => void;
  productFiltersCount: number;
  isProductsFiltersOpen: boolean;
  setIsProductsFiltersOpen: (value: boolean) => void;
  productsRowsPerPage: RowsPerPageValue;
  onRowsPerPageChange: (value: RowsPerPageValue) => void;
  onPageChange: (page: number) => void;

  productsStatus: 'idle' | 'loading' | 'success' | 'error';
  products: readonly PharmacyClientPurchasedProduct[];
  productsTotal: number;
  productsError: string;
  setProductsRetryVersion: Dispatch<SetStateAction<number>>;
  productsPage: number;
  productsTotalPages: number;
}>;

//===================================================================

export function ClientProductsTab({
  clientId,
  categoryOptions,
  productId,
  onProductIdChange,
  productFiltersCount,
  isProductsFiltersOpen,
  setIsProductsFiltersOpen,
  productsRowsPerPage,
  onRowsPerPageChange,
  onPageChange,
  productsStatus,
  products,
  productsTotal,
  productsError,
  setProductsRetryVersion,
  productsPage,
  productsTotalPages,
}: ProductsTabProps) {
  const loadPurchasedProducts = useCallback<ProductSuggestionsLoader>(
    async (params, options) => {
      const result = await getPharmacyClientProducts(
        clientId,
        {
          scope: 'owner',
          keyword: params.keyword,
          productId: params.productId,
          page: params.page,
          perPage: params.perPage,
        },
        options
      );

      return {
        page: result.page,
        totalPages: result.totalPages,
        items: result.items.map((product) => ({
          id: product.productId,
          article: product.article,
          name: product.name,
          photoUrl: product.photoUrl,
        })),
      };
    },
    [clientId]
  );

  const columns = useMemo(
    () =>
      buildClientProductColumns(
        new Map<string, string | undefined>(
          categoryOptions.flatMap((item) => {
            const pairs: Array<readonly [string, string | undefined]> = [
              [item.value, item.icon],
            ];
            if (item.categoryId) pairs.push([item.categoryId, item.icon]);
            return pairs;
          })
        )
      ),
    [categoryOptions]
  );

  return (
    <div className={css.sectionStack}>
      <ProfileSectionHeader
        title="Purchased products"
        description="Products in this client's successful orders across your pharmacies."
        icon={<PackageCheck size={21} aria-hidden="true" />}
      />

      <section className={css.sectionCard}>
        <div className={css.ownerSearchGrid}>
          <OwnerProductSearch
            id="client-purchased-products-search"
            value={productId}
            loadProducts={loadPurchasedProducts}
            description="Find a product by ID, article or name. Suggestions load progressively; only this client's purchased products appear in the results."
            onChange={onProductIdChange}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={productFiltersCount}
              controlsId="client-products-filters-panel"
              isExpanded={isProductsFiltersOpen}
              className={css.filterButton}
              onClick={() => setIsProductsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.sectionCard}>
        <div className={css.tableStack}>
          <div className={css.tableToolbar}>
            <div className={css.rowsControl}>
              <RowsPerPageSelect
                id="client-products-rows-per-page"
                value={productsRowsPerPage}
                options={PRODUCT_ROWS_PER_PAGE_OPTIONS}
                onChange={onRowsPerPageChange}
              />
            </div>
            {productsStatus === 'success' ? (
              <CountLabel
                className={css.countLabel}
                shown={products.length}
                total={productsTotal}
                label="products"
                fullWidthOnMobile
              />
            ) : null}
          </div>

          {productsStatus === 'error' ? (
            <ProfileResourceState
              variant="error"
              title="Purchased products could not be loaded"
              description={productsError}
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={() => setProductsRetryVersion((version) => version + 1)}
            />
          ) : (
            <DataTable
              columns={columns}
              items={products}
              getItemKey={(item) => item.id}
              isLoading={
                productsStatus === 'idle' || productsStatus === 'loading'
              }
              minWidth={0}
              labels={{
                loading: 'Loading purchased products...',
                empty: 'No successful-order products match the filters.',
              }}
            />
          )}

          {productsStatus === 'success' ? (
            <PaginationView
              currentPage={productsPage}
              totalPages={productsTotalPages}
              onPageChange={onPageChange}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
