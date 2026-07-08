'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';

import {
  Button,
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import {
  ProductRequestStatistics,
  StatusBanner,
} from '@e-pharmacy/ui/statistics';

import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type PharmacyProductRequestRow,
  type PharmacyProductRequestsQueryParams,
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

import { ProductRequestsFiltersDrawer } from '@/components/product-requests/ProductRequestsFiltersDrawer';
import { ProductRequestsTable } from '@/components/product-requests/ProductRequestsTable';

import css from './ProductRequestsPageContent.module.css';

//===================================================================

function getActiveFiltersCount(filters: ProductRequestsFilterState): number {
  return [
    filters.date.from || filters.date.to,
    filters.requestNumber.trim(),
    filters.productArticle.trim(),
    filters.productName.trim(),
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
  const [requests, setRequests] = useState<PharmacyProductRequestRow[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestStatistics, setRequestStatistics] =
    useState<ProductRequestStatisticsCounts>(
      DEFAULT_PRODUCT_REQUEST_STATISTICS
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

  const queryParams = useMemo(
    () => getProductRequestsQueryParams(filters, rowsPerPage),
    [filters, rowsPerPage]
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

  useEffect(() => {
    const nextPath = buildProductRequestsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setFilters(DEFAULT_PRODUCT_REQUESTS_FILTERS);
  };

  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = getLockedFeatureBannerLabel(bannerStatus);

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

        <StatusBanner
          status={bannerStatus}
          label={bannerLabel}
          title="Verification is required"
          message={
            bannerStatus === 'on_verification'
              ? 'Creating product requests is paused while Admin reviews the submitted pharmacy profile.'
              : 'Creating product requests is locked for a new pharmacy until verification is complete.'
          }
        />

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
              setFilters((currentFilters) => ({
                ...currentFilters,
                requestNumber,
              }))
            }
          />

          <SearchInput
            id="product-requests-product-article-search"
            label="Product article search"
            value={filters.productArticle}
            placeholder="Product article"
            isActive={Boolean(filters.productArticle)}
            onChange={(productArticle) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                productArticle,
              }))
            }
          />

          <SearchInput
            id="product-requests-product-name-search"
            label="Product name search"
            value={filters.productName}
            placeholder="Product name"
            isActive={Boolean(filters.productName)}
            onChange={(productName) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                productName,
              }))
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
          <CountLabel
            className={css.countLabel}
            shown={requests.length}
            total={totalRequests}
            label="requests"
          />

          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="product-requests-rows-per-page"
              value={rowsPerPage}
              onChange={setRowsPerPage}
            />
          </div>

          <Button className={css.createButton} type="button" size="md" disabled>
            Create request
          </Button>
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
      </section>

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
