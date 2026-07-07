'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PackageSearch } from 'lucide-react';

import {
  AllProductStatistics,
  CountLabel,
  FiltersButton,
  Pagination,
  RowsPerPageSelect,
  SearchInput,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type { EntityId, Product } from '@e-pharmacy/types';

import {
  DEFAULT_ALL_PRODUCT_STATISTICS,
  type AllProductStatisticsCounts,
  type AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import { getMyPharmacyProfile, getProducts } from '@/lib/api/browser';

import {
  DEFAULT_ALL_PRODUCTS_FILTERS,
  type AllProductsFilterState,
} from '@/lib/products/all-products-filters';

import { buildAllProductsPath } from '@/lib/products/all-product-paths';
import { getPharmacyAllProductStatistics } from '@/lib/products/product-statistics';

import { AllProductsFiltersDrawer } from '@/components/all-products/AllProductsFiltersDrawer';
import { AllProductsTable } from '@/components/all-products/AllProductsTable';

import css from './AllProductsPageContent.module.css';

//===================================================================

function getActiveFiltersCount(filters: AllProductsFilterState): number {
  return [
    filters.createdDate.from || filters.createdDate.to,
    filters.name.trim(),
    filters.article.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.addedToMyPharmacy !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getProductsQueryParams(
  filters: AllProductsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number,
  currentPharmacyId: EntityId | null
) {
  const isAddedToMyPharmacyFilterActive = filters.addedToMyPharmacy !== 'all';

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
    addedToMyPharmacy: isAddedToMyPharmacyFilterActive
      ? filters.addedToMyPharmacy === 'yes'
      : undefined,
    addedToPharmacyId:
      isAddedToMyPharmacyFilterActive && currentPharmacyId
        ? currentPharmacyId
        : undefined,
    sort: 'newest' as const,
  };
}

//===================================================================

type AllProductsPageContentProps = Readonly<{
  initialFilters?: AllProductsFilterState;
}>;

//===================================================================

function AllProductsPageContent({
  initialFilters = DEFAULT_ALL_PRODUCTS_FILTERS,
}: AllProductsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] =
    useState<AllProductsFilterState>(initialFilters);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [productStatistics, setProductStatistics] =
    useState<AllProductStatisticsCounts>(DEFAULT_ALL_PRODUCT_STATISTICS);

  const [currentPharmacyId, setCurrentPharmacyId] = useState<EntityId | null>(
    null
  );

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
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
      } finally {
        if (isMounted) setIsProfileLoaded(true);
      }
    }

    void loadPharmacyProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentPharmacyId) return;

    let isMounted = true;

    async function loadProductStatistics(pharmacyId: EntityId) {
      try {
        const nextStatistics =
          await getPharmacyAllProductStatistics(pharmacyId);

        if (isMounted) setProductStatistics(nextStatistics);
      } catch {
        if (isMounted) setProductStatistics(DEFAULT_ALL_PRODUCT_STATISTICS);
      }
    }

    void loadProductStatistics(currentPharmacyId);

    return () => {
      isMounted = false;
    };
  }, [currentPharmacyId]);

  const queryParams = useMemo(
    () =>
      getProductsQueryParams(
        filters,
        rowsPerPage,
        currentPage,
        currentPharmacyId
      ),
    [currentPage, currentPharmacyId, filters, rowsPerPage]
  );

  useEffect(() => {
    if (!isProfileLoaded) return;

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
  }, [isProfileLoaded, queryParams]);

  useEffect(() => {
    const nextPath = buildAllProductsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

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
    setFilters(DEFAULT_ALL_PRODUCTS_FILTERS);
  };

  const getProductStatisticHref = (key: AllProductStatisticsKey) => {
    if (key === 'active') {
      return buildAllProductsPath({
        ...DEFAULT_ALL_PRODUCTS_FILTERS,
        status: 'active',
      });
    }

    if (key === 'blocked') {
      return buildAllProductsPath({
        ...DEFAULT_ALL_PRODUCTS_FILTERS,
        status: 'blocked',
      });
    }

    if (key === 'addedToPharmacy') {
      return buildAllProductsPath({
        ...DEFAULT_ALL_PRODUCTS_FILTERS,
        addedToMyPharmacy: 'yes',
      });
    }

    if (key === 'notAddedToPharmacy') {
      return buildAllProductsPath({
        ...DEFAULT_ALL_PRODUCTS_FILTERS,
        addedToMyPharmacy: 'no',
      });
    }

    return buildAllProductsPath(DEFAULT_ALL_PRODUCTS_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="all-products-page-title">
      <section
        className={css.heroCard}
        aria-labelledby="all-products-page-title"
      >
        <PageHeader
          title="All products"
          titleId="all-products-page-title"
          icon={<PackageSearch size={23} aria-hidden="true" />}
        />

        <StatusBanner
          status="new"
          label="New"
          title="Catalog is available in read-only mode"
          message="Active and blocked Admin products are shown here. Adding products to your pharmacy becomes available after Admin verifies your pharmacy profile."
        />

        <AllProductStatistics
          counts={productStatistics}
          getStatisticHref={getProductStatisticHref}
          className={css.productStatistics}
        />
      </section>

      <section
        className={css.heroCard}
        aria-labelledby="all-products-page-title"
      >
        <div className={css.searchGrid}>
          <SearchInput
            id="all-products-product-article-search"
            label="Product article search"
            value={filters.article}
            placeholder="Product article"
            isActive={Boolean(filters.article)}
            onChange={(article) =>
              handleFiltersChange({
                ...filters,
                article,
              })
            }
          />

          <SearchInput
            id="all-products-product-name-search"
            label="Product name search"
            value={filters.name}
            placeholder="Product name"
            isActive={Boolean(filters.name)}
            onChange={(name) =>
              handleFiltersChange({
                ...filters,
                name,
              })
            }
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="all-products-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.tableCard} aria-label="All products table">
        <div className={css.toolbar}>
          <RowsPerPageSelect
            id="all-products-rows-per-page"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          />

          <CountLabel
            shown={products.length}
            total={totalProducts}
            label="products"
          />
        </div>

        <AllProductsTable
          currentPharmacyId={currentPharmacyId}
          products={products}
          isLoading={!isProfileLoaded || isLoading}
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
          renderLink={({ href, className, children, 'aria-label': label }) => (
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
      </section>

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
export type { AllProductsFilterState };
