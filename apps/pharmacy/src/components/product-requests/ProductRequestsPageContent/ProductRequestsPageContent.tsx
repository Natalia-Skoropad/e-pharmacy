'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { getPharmacyNewRequestPath } from '@e-pharmacy/config/pharmacy';

import {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestRow,
  type ProductRequestsQueryParams,
  type ProductRequestStatisticsCounts,
  type ProductRequestsFilterState,
} from '@e-pharmacy/types/product-requests';

import { getPharmacyProductRequests } from '@/lib/api/browser';
import { getPharmacyRequestsFilterPath } from '@/lib/layout/routes';
import { buildProductRequestsPath } from '@/lib/product-requests/product-request-paths';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import { ProductRequestStatistics } from '@/components/statistics';
import { StatusBanner } from '@/components/common/StatusPresentation';
import { ProductRequestsFiltersDrawer } from '@/components/product-requests/ProductRequestsFiltersDrawer';
import { ProductRequestsTable } from '@/components/product-requests/ProductRequestsTable';

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
    dateFrom: filters.date.from || undefined,
    dateTo: filters.date.to || undefined,
    requestNumber: filters.requestNumber.trim() || undefined,
    productName: filters.productName.trim() || undefined,
    productArticle: filters.productArticle.trim() || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    status: filters.status === 'all' ? undefined : filters.status,
  };
}

//===================================================================

type ProductRequestsPageContentProps = Readonly<{
  initialFilters?: ProductRequestsFilterState;
}>;

//===================================================================

function ProductRequestsPageContent({
  initialFilters = DEFAULT_PRODUCT_REQUESTS_FILTERS,
}: ProductRequestsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] =
    useState<ProductRequestsFilterState>(initialFilters);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<ProductRequestRow[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [requestStatistics, setRequestStatistics] =
    useState<ProductRequestStatisticsCounts>(
      DEFAULT_PRODUCT_REQUEST_STATISTICS
    );

  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryParams = useMemo(
    () => getProductRequestsQueryParams(filters, rowsPerPage, currentPage),
    [currentPage, filters, rowsPerPage]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProductRequestStatistics() {
      try {
        const statistics = await getPharmacyProductRequestStatistics();
        if (isMounted) setRequestStatistics(statistics);
      } catch {
        if (isMounted) {
          setRequestStatistics(DEFAULT_PRODUCT_REQUEST_STATISTICS);
        }
      }
    }

    void loadProductRequestStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProductRequests() {
      setIsLoading(true);

      try {
        const response = await getPharmacyProductRequests(queryParams);
        if (!isMounted) return;

        setRequests(response.items);
        setTotalRequests(response.total);
        setTotalPages(response.totalPages);
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (!isMounted) return;

        setRequests([]);
        setTotalRequests(0);
        setTotalPages(0);
        setEarliestCreatedAt(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProductRequests();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  useEffect(() => {
    const nextPath = buildProductRequestsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.date.from || filters.date.to),
    Boolean(filters.requestNumber.trim()),
    Boolean(filters.productArticle.trim()),
    Boolean(filters.productName.trim()),
    filters.category !== 'all',
    filters.status !== 'all'
  );
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: ProductRequestsFilterState) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_PRODUCT_REQUESTS_FILTERS);
    setCurrentPage(1);
  };

  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;
  const isCreateRequestLocked =
    Boolean(bannerStatus) || currentPharmacyStatus === 'blocked';

  return (
    <main className={css.page} aria-labelledby="product-requests-page">
      <section
        className={css.tableCard}
        aria-label="product-requests-page-title"
      >
        <PageHeader
          title="Product requests"
          titleId="product-requests-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
        />

        {bannerStatus ? (
          <StatusBanner
            status={bannerStatus}
            label={bannerLabel ?? undefined}
            title="Verification is required"
            message={
              bannerStatus === 'on_verification'
                ? 'Creating product requests is paused while Admin reviews the submitted pharmacy profile.'
                : 'Creating product requests is locked for a new pharmacy until verification is complete.'
            }
          />
        ) : null}

        <ProductRequestStatistics
          className={css.requestStatistics}
          counts={requestStatistics}
          getStatusHref={(status) => getPharmacyRequestsFilterPath({ status })}
        />
      </section>

      <section
        className={css.heroCard}
        aria-labelledby="product-requests-search"
      >
        <div className={css.searchGrid}>
          <SearchInput
            id="product-requests-request-number-search"
            label="Request number search"
            value={filters.requestNumber}
            placeholder="Request number"
            isActive={Boolean(filters.requestNumber)}
            onChange={(requestNumber) =>
              handleFiltersChange({
                ...filters,
                requestNumber,
              })
            }
          />

          <SearchInput
            id="product-requests-product-article-search"
            label="Product article search"
            value={filters.productArticle}
            placeholder="Product article"
            isActive={Boolean(filters.productArticle)}
            onChange={(productArticle) =>
              handleFiltersChange({
                ...filters,
                productArticle,
              })
            }
          />

          <SearchInput
            id="product-requests-product-name-search"
            label="Product name search"
            value={filters.productName}
            placeholder="Product name"
            isActive={Boolean(filters.productName)}
            onChange={(productName) =>
              handleFiltersChange({
                ...filters,
                productName,
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
          />

          {isCreateRequestLocked ? (
            <Button
              className={css.createButton}
              type="button"
              size="md"
              disabled
            >
              Create request
            </Button>
          ) : (
            <LinkButton
              className={css.createButton}
              href={getPharmacyNewRequestPath()}
              size="md"
            >
              Create request
            </LinkButton>
          )}
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

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>

      {isFiltersOpen ? (
        <ProductRequestsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
          onChange={handleFiltersChange}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}
    </main>
  );
}

export default ProductRequestsPageContent;
export { ProductRequestsPageContent };
