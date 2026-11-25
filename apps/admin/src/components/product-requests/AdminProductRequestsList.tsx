'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FilePlus2, RefreshCw } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatsLoadingSkeleton, StatusBanner } from '@e-pharmacy/ui/statistics';
import { RowsPerPageSelect } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { ADMIN_ROUTES } from '@/lib/routes';

import {
  getAdminProductRequests,
  getAdminProductRequestStatistics,
  getAdminProductRequestCategories,
  getAdminProductRequestOwnerOptions,
} from '@/lib/api/browser/admin-product-requests.api';

import {
  CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  type ProductRequestsFilterState,
  type ProductRequestsQueryParams,
  type ProductRequestsViewModelResponse,
  type ProductRequestStatisticsCounts,
} from '@/lib/product-requests/admin-product-requests';

import {
  buildProductRequestsPath,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
  type ProductRequestsPagination,
} from '@/lib/product-requests/admin-product-request-paths';

import { PharmacyOwnerSearch } from '@/components/pharmacy-owners/PharmacyOwnerSearch/PharmacyOwnerSearch';

import { ProductRequestSearch } from './ProductRequestSearch';
import { ProductRequestStatistics } from './ProductRequestStatistics';
import { ProductRequestsFiltersDrawer } from './ProductRequestsFiltersDrawer';
import { ProductRequestsTable } from './ProductRequestsTable';

import css from './AdminProductRequestsList.module.css';

//===================================================================

// URL is the single source of truth, including Back/Forward. Native History API
// integrates with usePathname in Next, keeping the open filter drawer mounted.
function navigate(
  filters: ProductRequestsFilterState,
  pagination: ProductRequestsPagination,
  replace = false
) {
  const next = buildProductRequestsPath(filters, pagination);

  if (window.location.pathname === next) return;
  if (replace) window.history.replaceState(null, '', next);
  else window.history.pushState(null, '', next);
}

//===================================================================

function queryFor(
  filters: ProductRequestsFilterState,
  pagination: ProductRequestsPagination
): ProductRequestsQueryParams {
  return {
    page: pagination.page,
    perPage: pagination.perPage,
    ownerId: filters.ownerId || undefined,
    requestId: filters.requestId || undefined,

    dateFrom: isCalendarDateString(filters.date.from)
      ? filters.date.from
      : undefined,

    dateTo: isCalendarDateString(filters.date.to) ? filters.date.to : undefined,

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

type Resource<T> = Readonly<{ key: string; value: T | null; error: boolean }>;

//===================================================================

export function AdminProductRequestsList() {
  const pathname = usePathname();

  const { filters, pagination } = useMemo(() => {
    const segments = pathname
      .slice(ADMIN_ROUTES.PRODUCT_REQUESTS.length)
      .split('/')
      .filter(Boolean);

    return {
      filters: parseProductRequestsSegments({ filters: segments }),
      pagination: parseProductRequestsPaginationSegments({ filters: segments }),
    };
  }, [pathname]);

  const params = useMemo(
    () => queryFor(filters, pagination),
    [filters, pagination]
  );

  const [listRetry, setListRetry] = useState(0);
  const [statsRetry, setStatsRetry] = useState(0);
  const [categoryRetry, setCategoryRetry] = useState(0);

  const [list, setList] =
    useState<Resource<ProductRequestsViewModelResponse> | null>(null);

  const [stats, setStats] =
    useState<Resource<ProductRequestStatisticsCounts> | null>(null);

  const [categories, setCategories] = useState<Resource<
    readonly ProductCategoryReference[]
  > | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const listKey = `${pathname}|${listRetry}`;
  const statsKey = String(statsRetry);
  const categoryKey = String(categoryRetry);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminProductRequests(params, { signal: controller.signal })
      .then((value) => {
        if (
          controller.signal.aborted ||
          window.location.pathname !==
            buildProductRequestsPath(filters, pagination)
        )
          return;

        if (pagination.page !== value.page) {
          navigate(filters, { ...pagination, page: value.page }, true);
          return;
        }

        setList({ key: listKey, value, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setList({ key: listKey, value: null, error: true });
      });

    return () => controller.abort();
  }, [params, listKey, filters, pagination]);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminProductRequestStatistics({ signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted)
          setStats({ key: statsKey, value, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStats({ key: statsKey, value: null, error: true });
      });

    return () => controller.abort();
  }, [statsKey]);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminProductRequestCategories({ signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted)
          setCategories({ key: categoryKey, value, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setCategories({ key: categoryKey, value: null, error: true });
      });

    return () => controller.abort();
  }, [categoryKey]);

  const { ownerId, requestId, category, status, date } = filters;

  // Scope each search by the other search and the selected drawer filters,
  // excluding its own value and pagination.
  const requestScope = useMemo(
    () =>
      queryFor(
        {
          ownerId,
          requestId: '',
          category,
          status,
          date: { from: date.from, to: date.to },
        },
        { page: 1, perPage: 20 }
      ),
    [ownerId, category, status, date.from, date.to]
  );

  const ownerScope = useMemo(
    () =>
      queryFor(
        {
          ownerId: '',
          requestId,
          category,
          status,
          date: { from: date.from, to: date.to },
        },
        { page: 1, perPage: 20 }
      ),
    [requestId, category, status, date.from, date.to]
  );

  const loadScopedOwnerOptions = useCallback(
    (
      options: Readonly<{ search?: string; limit?: number; page?: number }>,
      readOptions?: Readonly<{ signal?: AbortSignal }>
    ) =>
      getAdminProductRequestOwnerOptions(
        {
          ...ownerScope,
          keyword: options.search,
          perPage: options.limit,
          page: options.page,
        },
        readOptions
      ),
    [ownerScope]
  );

  const activeCount = [
    Boolean(ownerId),
    Boolean(requestId),
    category !== 'all',
    status !== 'all',
    Boolean(date.from || date.to),
  ].filter(Boolean).length;

  const changeFilters = (next: ProductRequestsFilterState) =>
    navigate(next, { ...pagination, page: 1 });

  const data = list?.key === listKey ? list.value : null;
  const loading = list?.key !== listKey;
  const listError = list?.key === listKey && list.error;
  const statsData = stats?.key === statsKey ? stats.value : null;
  const directory = categories?.key === categoryKey ? categories.value : null;

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...(directory ?? []).map((item) => ({
        value: item.slug,
        label: item.name,
        icon: item.icon,
      })),

      ...(category !== 'all' &&
      category !== CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER &&
      !directory?.some((item) => item.slug === category)
        ? [{ value: category, label: category.replace(/_/g, ' ') }]
        : []),
      {
        value: CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
        label: 'Other / custom category',
        icon: 'settings',
      },
    ],
    [category, directory]
  );

  const categoryUnavailable =
    categories?.key === categoryKey && categories.error;

  return (
    <main className={css.page} aria-labelledby="product-requests-page-title">
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
          {stats?.key !== statsKey ? (
            <StatsLoadingSkeleton
              count={4}
              columns={4}
              tabletColumns={2}
              label="Loading product request statistics"
            />
          ) : statsData ? (
            <ProductRequestStatistics
              counts={statsData}
              activeStatuses={status === 'all' ? [] : [status]}
              onStatusChange={(next) =>
                changeFilters({
                  ...filters,
                  status: next === status ? 'all' : next,
                })
              }
            />
          ) : (
            <ProfileResourceState
              variant="error"
              title="Product request statistics could not be loaded"
              description="The product request statistics are temporarily unavailable."
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={() => setStatsRetry((v) => v + 1)}
            />
          )}
        </div>
      </section>
      <section
        className={css.heroCard}
        aria-label="Search and filter product requests"
      >
        <div className={css.searchGrid}>
          {/* Scope changes reset remote suggestions; sibling keys must remain distinct even with identical scopes. */}
          <PharmacyOwnerSearch
            key={`owner-search:${JSON.stringify(ownerScope)}`}
            value={ownerId}
            loadOptions={loadScopedOwnerOptions}
            onChange={(next) => changeFilters({ ...filters, ownerId: next })}
          />

          <ProductRequestSearch
            key={`request-search:${JSON.stringify(requestScope)}`}
            value={requestId}
            relatedFilters={requestScope}
            onChange={(next) => changeFilters({ ...filters, requestId: next })}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeCount}
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
              value={pagination.perPage}
              onChange={(perPage) => navigate(filters, { page: 1, perPage })}
            />
          </div>

          <CountLabel
            className={css.countLabel}
            shown={data?.items.length ?? 0}
            total={data?.total ?? 0}
            label="requests"
            fullWidthOnMobile
          />
        </div>

        {listError ? (
          <div role="alert">
            <StatusBanner
              tone="danger"
              title="Product requests are temporarily unavailable"
              message="Product requests could not be loaded. Please try again in a moment."
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              iconLeft={<RefreshCw size={16} aria-hidden="true" />}
              onClick={() => setListRetry((v) => v + 1)}
            >
              Retry product requests
            </Button>
          </div>
        ) : null}
        <ProductRequestsTable
          requests={data ? [...data.items] : []}
          isLoading={loading}
          emptyMessage={
            listError
              ? 'Product requests are temporarily unavailable.'
              : activeCount
                ? 'No requests found for the selected filters.'
                : 'No product requests yet.'
          }
        />

        <PaginationView
          currentPage={pagination.page}
          totalPages={Math.max(1, data?.totalPages ?? 1)}
          ariaLabel="Product requests pagination"
          onPageChange={(page) => navigate(filters, { ...pagination, page })}
        />
      </section>

      {isFiltersOpen ? (
        <ProductRequestsFiltersDrawer
          filters={filters}
          hasActiveFilters={activeCount > 0}
          minDate={list?.value?.earliestCreatedAt ?? undefined}
          categoryOptions={categoryOptions}
          categoryLoading={categories?.key !== categoryKey}
          categoryError={categoryUnavailable}
          onRetryCategories={() => setCategoryRetry((v) => v + 1)}
          onChange={changeFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={() =>
            navigate(DEFAULT_PRODUCT_REQUESTS_FILTERS, {
              page: 1,
              perPage: pagination.perPage,
            })
          }
        />
      ) : null}
    </main>
  );
}
