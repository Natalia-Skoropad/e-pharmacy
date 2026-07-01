'use client';

import { useEffect, useMemo, useState } from 'react';
import { FilePlus2 } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
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

import type { ProductCategory } from '@e-pharmacy/types';

import { getPharmacyProductRequests } from '@/lib/api/browser';

import type {
  PharmacyProductRequestRow,
  PharmacyProductRequestsQueryParams,
  ProductRequestStatus,
} from '@/lib/pharmacy/product-requests';

import { ProductRequestsFiltersDrawer } from '@/components/product-requests/ProductRequestsFiltersDrawer';
import { ProductRequestsTable } from '@/components/product-requests/ProductRequestsTable';

import css from './ProductRequestsPageContent.module.css';

//===================================================================

type ProductRequestCategoryFilter = 'all' | ProductCategory;
type ProductRequestStatusFilter = 'all' | ProductRequestStatus;

//===================================================================

export type ProductRequestsFilterState = Readonly<{
  date: {
    from: string;
    to: string;
  };
  name: string;
  article: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
}>;

//===================================================================

const DEFAULT_FILTERS: ProductRequestsFilterState = {
  date: {
    from: '',
    to: '',
  },
  name: '',
  article: '',
  category: 'all',
  status: 'all',
};

//===================================================================

function getActiveFiltersCount(filters: ProductRequestsFilterState): number {
  return [
    filters.date.from || filters.date.to,
    filters.name.trim(),
    filters.article.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getProductRequestsQueryParams(
  filters: ProductRequestsFilterState,
  rowsPerPage: RowsPerPageValue
): PharmacyProductRequestsQueryParams {
  return {
    page: 1,
    perPage: rowsPerPage,
    dateFrom: filters.date.from || undefined,
    dateTo: filters.date.to || undefined,
    name: filters.name.trim() || undefined,
    article: filters.article.trim() || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    status: filters.status === 'all' ? undefined : filters.status,
  };
}

//===================================================================

function ProductRequestsPageContent() {
  const [filters, setFilters] =
    useState<ProductRequestsFilterState>(DEFAULT_FILTERS);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [requests, setRequests] = useState<PharmacyProductRequestRow[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
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

  const queryParams = useMemo(
    () => getProductRequestsQueryParams(filters, rowsPerPage),
    [filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProductRequests() {
      setIsLoading(true);

      try {
        const response = await getPharmacyProductRequests(queryParams);
        if (!isMounted) return;

        setRequests(response.items);
        setTotalRequests(response.total);
      } catch {
        if (!isMounted) return;

        setRequests([]);
        setTotalRequests(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProductRequests();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="product-requests-page-title">
      <div className={css.card}>
        <PageHeader
          title="Product requests"
          titleId="product-requests-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
          actions={
            <CountLabel
              shown={requests.length}
              total={totalRequests}
              label="requests"
            />
          }
        />

        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Verification is required"
            message="Creating product requests is locked for a new pharmacy until verification is complete."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarActions}>
              <RowsPerPageSelect
                id="product-requests-rows-per-page"
                value={rowsPerPage}
                onChange={setRowsPerPage}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="product-requests-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
              />
            </div>
          </div>

          <ProductRequestsTable
            requests={requests}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters
                ? 'No requests found for the selected filters.'
                : 'Your pharmacy has no product creation requests yet.'
            }
          />
        </div>
      </div>

      {isFiltersOpen ? (
        <ProductRequestsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onBackdropMouseDown={handleBackdropClick}
          onChange={setFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default ProductRequestsPageContent;
export { ProductRequestsPageContent };
