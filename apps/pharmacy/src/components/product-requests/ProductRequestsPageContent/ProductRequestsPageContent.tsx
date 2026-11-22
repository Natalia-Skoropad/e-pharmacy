'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FilePlus2, Plus } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { LinkButton, PaginationView } from '@e-pharmacy/ui/navigation';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatsLoadingSkeleton, StatusBanner } from '@e-pharmacy/ui/statistics';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';

import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import {
  CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestRowViewModel,
  type ProductRequestsQueryParams,
  type ProductRequestStatisticsCounts,
  type ProductRequestsFilterState,
} from '@/lib/product-requests/product-requests';

import {
  getPharmacyProductRequests,
  getProductCategories,
} from '@/lib/api/browser';

import {
  buildProductRequestsPath,
  DEFAULT_PRODUCT_REQUESTS_PAGINATION,
  type ProductRequestsPagination,
} from '@/lib/product-requests/product-request-paths';

import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';
import { PHARMACY_ROUTES } from '@/lib/routes';
import { clampProductListPage } from '@/lib/products/product-pagination';

import { ProductRequestStatistics } from '@/components/statistics/ProductRequestStatistics/ProductRequestStatistics';
import { ProductRequestsFiltersDrawer } from '@/components/product-requests/ProductRequestsFiltersDrawer';
import { ProductRequestsTable } from '@/components/product-requests/ProductRequestsTable';
import { OwnerProductRequestSearch } from '@/components/product-requests/OwnerProductRequestSearch';
import { OwnerRequestedProductSearch } from '@/components/product-requests/OwnerRequestedProductSearch';

import css from './ProductRequestsPageContent.module.css';

//===================================================================

function getProductRequestsQueryParams(
  filters: ProductRequestsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number
): ProductRequestsQueryParams {
  return {
    page,
    perPage: rowsPerPage,

    dateFrom: isCalendarDateString(filters.date.from)
      ? filters.date.from
      : undefined,

    dateTo: isCalendarDateString(filters.date.to) ? filters.date.to : undefined,
    requestId: filters.requestId || undefined,
    productId: filters.productId || undefined,

    category:
      filters.category === 'all' ||
      filters.category === CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER
        ? undefined
        : filters.category,

    categoryMode:
      filters.category === CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER
        ? 'custom'
        : filters.category === 'all'
          ? undefined
          : 'catalog',

    status: filters.status === 'all' ? undefined : filters.status,
  };
}

//===================================================================

type ProductRequestsPageContentProps = Readonly<{
  embedded?: boolean;
  initialFilters?: ProductRequestsFilterState;
  initialPagination?: ProductRequestsPagination;
}>;

//===================================================================

function ProductRequestsPageContent({
  embedded = false,
  initialFilters = DEFAULT_PRODUCT_REQUESTS_FILTERS,
  initialPagination = DEFAULT_PRODUCT_REQUESTS_PAGINATION,
}: ProductRequestsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] =
    useState<ProductRequestsFilterState>(initialFilters);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(
    initialPagination.perPage
  );

  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  const [categoryDirectory, setCategoryDirectory] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All categories' },
      ...categoryDirectory.map((category) => ({
        value: category.slug,
        label: category.name,
        icon: category.icon,
      })),
      {
        value: CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
        label: 'Other / custom category',
        icon: 'settings',
      },
    ],
    [categoryDirectory]
  );

  const [requests, setRequests] = useState<ProductRequestRowViewModel[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [requestStatistics, setRequestStatistics] =
    useState<ProductRequestStatisticsCounts>(
      DEFAULT_PRODUCT_REQUEST_STATISTICS
    );

  const [isRequestStatisticsUnavailable, setIsRequestStatisticsUnavailable] =
    useState(false);

  const [isRequestStatisticsLoading, setIsRequestStatisticsLoading] =
    useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const reloadStatistics = () => {
    setIsRequestStatisticsLoading(true);
    setRetryVersion((version) => version + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    void getProductCategories({ signal: controller.signal })
      .then((categories) => {
        if (!controller.signal.aborted) setCategoryDirectory(categories);
      })
      .catch(() => {
        // Keep the neutral fallback; list and statistics have independent errors.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyProductRequestStatistics({ signal: controller.signal })
      .then((statistics) => {
        if (controller.signal.aborted) return;

        setRequestStatistics(statistics);
        setIsRequestStatisticsUnavailable(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsRequestStatisticsUnavailable(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRequestStatisticsLoading(false);
      });

    return () => controller.abort();
  }, [retryVersion]);

  const queryParams = useMemo(
    () => getProductRequestsQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );

  // Suggestions are intersected with the currently selected filters, except
  // for the selected request itself. This prevents unrelated request options.
  const relatedRequestFilters = useMemo(
    () => getProductRequestsQueryParams({ ...filters, requestId: '' }, 20, 1),
    [filters]
  );

  const relatedProductFilters = useMemo(
    () => getProductRequestsQueryParams({ ...filters, productId: '' }, 20, 1),
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadProductRequests() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await getPharmacyProductRequests(queryParams, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const normalizedPage = clampProductListPage(
          currentPage,
          response.total,
          rowsPerPage
        );

        if (normalizedPage !== currentPage) {
          setCurrentPage(normalizedPage);
          return;
        }

        setRequests([...response.items]);
        setTotalRequests(response.total);
        setTotalPages(Math.max(1, response.totalPages));
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (controller.signal.aborted) return;

        setLoadError(
          'Product requests could not be loaded. Please try again in a moment.'
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProductRequests();

    return () => {
      controller.abort();
    };
  }, [currentPage, queryParams, retryVersion, rowsPerPage]);

  useEffect(() => {
    const nextPath = buildProductRequestsPath(filters, {
      page: currentPage,
      perPage: rowsPerPage,
    });

    if (pathname === nextPath) return;

    router.replace(nextPath, { scroll: false });
  }, [currentPage, filters, pathname, router, rowsPerPage]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.date.from || filters.date.to),
    Boolean(filters.requestId),
    Boolean(filters.productId),
    filters.category !== 'all',
    filters.status !== 'all'
  );

  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ProductRequestsFilterState) => {
    setCurrentPage(1);
    setFilters(nextFilters);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setCurrentPage(1);
    setRowsPerPage(nextRowsPerPage);
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setFilters(DEFAULT_PRODUCT_REQUESTS_FILTERS);
  };

  const getStatusHref = (status: ProductRequestStatus) =>
    buildProductRequestsPath(
      {
        ...filters,
        status: filters.status === status ? 'all' : status,
      },
      { page: 1, perPage: rowsPerPage }
    );

  const RootElement = embedded ? 'section' : 'main';

  return (
    <RootElement
      className={css.page}
      aria-labelledby="product-requests-page-title"
    >
      <section
        className={css.heroCard}
        aria-labelledby="product-requests-page-title"
      >
        <PageHeader
          title="Product requests"
          titleId="product-requests-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
        />

        <div className={css.requestStatistics}>
          {isRequestStatisticsLoading ? (
            <StatsLoadingSkeleton
              count={5}
              columns={5}
              tabletColumns={3}
              label="Loading product request statistics"
            />
          ) : isRequestStatisticsUnavailable ? (
            <ProfileResourceState
              variant="error"
              title="Product request statistics could not be loaded"
              description="The product request statistics are temporarily unavailable."
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={reloadStatistics}
            />
          ) : (
            <ProductRequestStatistics
              counts={requestStatistics}
              activeStatuses={filters.status === 'all' ? [] : [filters.status]}
              getStatusHref={getStatusHref}
            />
          )}
        </div>
      </section>

      <section
        className={css.heroCard}
        aria-label="Search and filter product requests"
      >
        <div className={css.searchGrid}>
          <OwnerProductRequestSearch
            value={filters.requestId}
            relatedFilters={relatedRequestFilters}
            onChange={(requestId, linkedProductId) =>
              handleFiltersChange({
                ...filters,
                requestId,

                // Like Orders -> Client: selecting a specific request also
                // selects its matching global product when it has one.
                productId: requestId
                  ? (linkedProductId ?? '')
                  : filters.productId,
              })
            }
          />
          <OwnerRequestedProductSearch
            value={filters.productId}
            relatedFilters={relatedProductFilters}
            onChange={(productId) =>
              handleFiltersChange({
                ...filters,
                productId,

                // Switching the product invalidates the previously selected
                // request; its options will now be scoped to the new product.
                requestId:
                  productId !== filters.productId ? '' : filters.requestId,
              })
            }
          />
          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="product-requests-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.tableCard} aria-label="Product requests table">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="product-requests-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            />
          </div>

          <CountLabel
            className={css.countLabel}
            shown={requests.length}
            total={totalRequests}
            label="requests"
            fullWidthOnMobile
          />

          <LinkButton
            className={css.createButton}
            href={PHARMACY_ROUTES.PRODUCT_REQUEST_NEW}
            size="md"
            iconLeft={<Plus size={17} aria-hidden="true" />}
          >
            Create request
          </LinkButton>
        </div>

        {loadError ? (
          <div role="alert">
            <StatusBanner
              tone="danger"
              title="Product requests are temporarily unavailable"
              message={loadError}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setRetryVersion((version) => version + 1)}
            >
              Retry product requests
            </Button>
          </div>
        ) : null}

        <ProductRequestsTable
          requests={requests}
          categoryDirectory={categoryDirectory}
          isLoading={isLoading}
          emptyMessage={
            loadError
              ? 'Product requests are temporarily unavailable.'
              : hasActiveFilters
                ? 'No requests found for the selected filters.'
                : 'You have no product creation requests yet.'
          }
        />

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          ariaLabel="Product requests pagination"
          onPageChange={setCurrentPage}
        />
      </section>

      {isFiltersOpen ? (
        <ProductRequestsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
          categoryOptions={categoryOptions}
          onChange={handleFiltersChange}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </RootElement>
  );
}

export default ProductRequestsPageContent;
export { ProductRequestsPageContent };
