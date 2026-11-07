import type { Dispatch, SetStateAction } from 'react';
import { PackageCheck } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { CountLabel, DataTable } from '@e-pharmacy/ui/data-display';

import {
  SearchInput,
  RowsPerPageSelect,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { PaginationView } from '@e-pharmacy/ui/navigation';

import type { PharmacyClientPurchasedProduct } from '@/lib/clients/clients';

import { PRODUCT_ROWS_PER_PAGE_OPTIONS } from './ClientDetailFilters';
import { PRODUCT_COLUMNS } from './ClientDetailTableColumns';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ProductsTabProps = Readonly<{
  productArticleSearch: string;
  setProductArticleSearch: (value: string) => void;
  productNameSearch: string;
  setProductNameSearch: (value: string) => void;
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
  productArticleSearch,
  setProductArticleSearch,
  productNameSearch,
  setProductNameSearch,
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
  return (
    <div className={css.sectionStack}>
      <section className={css.sectionCard}>
        <div className={css.titleWithTooltip}>
          <h2>Purchased products</h2>

          <InfoTooltip
            label="About purchased products"
            title="Successful purchases"
            icon={<PackageCheck size={20} aria-hidden="true" />}
            escapeOverflow
            items={[
              {
                title: 'Purchased quantity and amount',
                description:
                  'Totals across all successful orders containing the product.',
              },
              {
                title: 'First order date',
                description:
                  'The earliest successful order in which this product appeared.',
              },
              {
                title: 'Orders count',
                description:
                  'How many successful orders included this product. Each product appears only once in this table.',
              },
            ]}
          />
        </div>

        <div className={css.searchGrid}>
          <SearchInput
            id="client-product-article-search"
            label="Product article search"
            value={productArticleSearch}
            placeholder="Product article"
            isActive={Boolean(productArticleSearch)}
            onChange={setProductArticleSearch}
          />

          <SearchInput
            id="client-product-name-search"
            label="Product name search"
            value={productNameSearch}
            placeholder="Product name"
            isActive={Boolean(productNameSearch)}
            onChange={setProductNameSearch}
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
              />
            ) : null}
          </div>

          {productsStatus === 'error' ? (
            <div role="alert">
              <p className={css.errorText}>{productsError}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setProductsRetryVersion((version) => version + 1)
                }
              >
                Retry purchased products
              </Button>
            </div>
          ) : (
            <DataTable
              columns={PRODUCT_COLUMNS}
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
