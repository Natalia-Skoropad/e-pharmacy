'use client';

import { useEffect, useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  Pagination,
  RowsPerPageSelect,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type { EntityId, Product, ProductCategory } from '@e-pharmacy/types';

import { getMyPharmacyProfile, getProducts } from '@/lib/api/browser';

import type {
  OwnProductStatus,
  StockAvailabilityFilter,
} from '@/lib/products/products';

import { AllProductsFiltersDrawer } from '@/components/all-products/AllProductsFiltersDrawer';
import { AllProductsTable } from '@/components/all-products/AllProductsTable';

import css from './AllProductsPageContent.module.css';

//===================================================================

type ProductCategoryFilter = 'all' | ProductCategory;
type ProductStatusFilter = 'all' | OwnProductStatus;
type ProductStockFilter = 'all' | StockAvailabilityFilter;

//===================================================================

export type AllProductsFilterState = Readonly<{
  createdDate: {
    from: string;
    to: string;
  };
  name: string;
  article: string;
  category: ProductCategoryFilter;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
}>;

//===================================================================

const DEFAULT_FILTERS: AllProductsFilterState = {
  createdDate: {
    from: '',
    to: '',
  },
  name: '',
  article: '',
  category: 'all',
  status: 'all',
  stock: 'all',
};

//===================================================================

function getActiveFiltersCount(filters: AllProductsFilterState): number {
  return [
    filters.createdDate.from || filters.createdDate.to,
    filters.name.trim(),
    filters.article.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.stock !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getProductsQueryParams(
  filters: AllProductsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number
) {
  return {
    page,
    perPage: rowsPerPage,
    includeBlocked: true,
    addedFrom: filters.createdDate.from || undefined,
    addedTo: filters.createdDate.to || undefined,
    nameKeyword: filters.name.trim() || undefined,
    articleKeyword: filters.article.trim() || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    status: filters.status === 'all' ? undefined : filters.status,
    inStock:
      filters.stock === 'available'
        ? true
        : filters.stock === 'empty'
          ? false
          : undefined,
    sort: 'newest' as const,
  };
}

//===================================================================

function AllProductsPageContent() {
  const [filters, setFilters] =
    useState<AllProductsFilterState>(DEFAULT_FILTERS);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPharmacyId, setCurrentPharmacyId] = useState<EntityId | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useBodyScrollLock(isFiltersOpen);

  useEscapeToClose({
    isOpen: isFiltersOpen,
    onClose: () => setIsFiltersOpen(false),
  });

  const handleBackdropClick = useBackdropClick({
    onClose: () => setIsFiltersOpen(false),
  });

  useEffect(() => {
    let isMounted = true;

    async function loadPharmacyProfile() {
      try {
        const response = await getMyPharmacyProfile();
        if (!isMounted) return;

        setCurrentPharmacyId(response.pharmacy.id);
      } catch {
        if (!isMounted) return;

        setCurrentPharmacyId(null);
      }
    }

    void loadPharmacyProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const queryParams = useMemo(
    () => getProductsQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await getProducts(queryParams);
        if (!isMounted) return;

        setProducts(response.items);
        setTotalProducts(response.total);
        setTotalPages(Math.max(1, response.totalPages));
      } catch {
        if (!isMounted) return;

        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: AllProductsFilterState) => {
    setCurrentPage(1);
    setFilters(nextFilters);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setCurrentPage(1);
    setRowsPerPage(nextRowsPerPage);
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="all-products-page-title">
      <div className={css.card}>
        <PageHeader
          title="All products"
          titleId="all-products-page-title"
          icon={<PackageSearch size={23} aria-hidden="true" />}
          actions={
            <CountLabel
              shown={products.length}
              total={totalProducts}
              label="products"
            />
          }
        />

        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Catalog is available in read-only mode"
            message="Active and blocked Admin products are shown here. Adding products to your pharmacy becomes available after Admin verifies your pharmacy profile."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarActions}>
              <RowsPerPageSelect
                id="all-products-rows-per-page"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="all-products-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
              />
            </div>
          </div>

          <AllProductsTable
            currentPharmacyId={currentPharmacyId}
            products={products}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters
                ? 'No products found for the selected filters.'
                : 'No active or blocked Admin products are available yet.'
            }
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            getPageHref={(page) => String(page)}
            ariaLabel="All products pagination"
            renderLink={({
              href,
              className,
              children,
              'aria-label': label,
            }) => (
              <button
                className={className}
                type="button"
                aria-label={label}
                onClick={() => setCurrentPage(Number(href))}
              >
                {children}
              </button>
            )}
          />
        </div>
      </div>

      {isFiltersOpen ? (
        <AllProductsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onBackdropMouseDown={handleBackdropClick}
          onChange={handleFiltersChange}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default AllProductsPageContent;
export { AllProductsPageContent };
