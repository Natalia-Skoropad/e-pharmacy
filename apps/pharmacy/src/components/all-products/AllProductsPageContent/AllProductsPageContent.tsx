'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PackageSearch } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '@e-pharmacy/config/products';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PaginationView } from '@e-pharmacy/ui/navigation';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';

import type { EntityId } from '@e-pharmacy/types/primitives';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type {
  PharmacyProductsQueryParams,
  ProductDetails,
} from '@e-pharmacy/types/products';

import type {
  AllProductStatisticsCounts,
  AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import { getProductCategories } from '@/lib/api/browser';
import { getOwnedPharmacyStatistics } from '@/lib/api/browser/owned-pharmacy-registry.api';

import {
  getOwnerCatalogProducts,
  getOwnerCatalogStatistics,
  addOwnerCatalogProduct,
} from '@/lib/api/browser/owner-all-products.api';

import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import {
  DEFAULT_ALL_PRODUCTS_FILTERS,
  type AllProductsFilterState,
} from '@/lib/products/all-products-filters';

import { DEFAULT_ALL_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';

import {
  buildAllProductsPath,
  DEFAULT_ALL_PRODUCTS_PAGINATION,
  type AllProductsPagination,
} from '@/lib/products/all-product-paths';

import { clampProductListPage } from '@/lib/products/product-pagination';

import { AllProductStatistics } from '@/components/statistics';
import { AllProductsFiltersDrawer } from '@/components/all-products/AllProductsFiltersDrawer';
import { AllProductsTable } from '@/components/all-products/AllProductsTable';
import { OwnerProductSearch } from '@/components/all-products/OwnerProductSearch/OwnerProductSearch';
import { OwnerAddProductConfirmation } from '@/components/all-products/OwnerAddProductConfirmation/OwnerAddProductConfirmation';

import css from './AllProductsPageContent.module.css';

//===================================================================

function getProductsQueryParams(
  filters: AllProductsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number
): PharmacyProductsQueryParams {
  const isAddedToMyPharmacyFilterActive = filters.addedToMyPharmacy !== 'all';

  return {
    page,
    perPage: rowsPerPage,
    includeBlocked: true,

    addedFrom: isCalendarDateString(filters.createdDate.from)
      ? filters.createdDate.from
      : undefined,

    addedTo: isCalendarDateString(filters.createdDate.to)
      ? filters.createdDate.to
      : undefined,

    productId: filters.productId || undefined,
    nameKeyword: filters.name.trim() || undefined,
    articleKeyword: filters.article.trim() || undefined,
    ownerCatalog: true,
    category: filters.category === 'all' ? undefined : filters.category,
    status: filters.status === 'all' ? undefined : filters.status,

    addedToMyPharmacy: isAddedToMyPharmacyFilterActive
      ? filters.addedToMyPharmacy === 'yes'
      : undefined,

    sort: 'newest' as const,
  };
}

//===================================================================

function getAddProductErrorMessage(error: unknown): string {
  return getSafeApiErrorMessage(
    error,
    'Could not add product. Please try again.',
    {
      backendMessages: {
        [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND]:
          'Pharmacy profile is unavailable for this account.',

        [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_LOCKED]:
          'Adding products is unavailable until Admin verifies the pharmacy.',

        [PRODUCT_MANAGEMENT_ERROR_CODES.PRODUCT_BLOCKED]:
          'Blocked products cannot be added to your pharmacy.',

        [PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED]:
          'This product is already added to your pharmacy.',
      },
    }
  );
}

//===================================================================

type AllProductsPageContentProps = Readonly<{
  initialFilters?: AllProductsFilterState;
  initialPagination?: AllProductsPagination;
}>;

//===================================================================

function AllProductsPageContent({
  initialFilters = DEFAULT_ALL_PRODUCTS_FILTERS,
  initialPagination = DEFAULT_ALL_PRODUCTS_PAGINATION,
}: AllProductsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [filters, setFilters] =
    useState<AllProductsFilterState>(initialFilters);

  // The current Admin-managed category directory is the presentation source
  // for both the product table and the category filter.
  const [categoryDirectory, setCategoryDirectory] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },

      ...categoryDirectory.map((category) => ({
        value: category.slug,
        label: category.name,
        icon: category.icon,
      })),
    ],
    [categoryDirectory]
  );

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(
    initialPagination.perPage
  );

  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [totalPages, setTotalPages] = useState(1);

  const [productStatistics, setProductStatistics] =
    useState<AllProductStatisticsCounts>(DEFAULT_ALL_PRODUCT_STATISTICS);

  const [isProductStatisticsUnavailable, setIsProductStatisticsUnavailable] =
    useState(false);

  const [isProductStatisticsLoading, setIsProductStatisticsLoading] =
    useState(true);

  const [productToAdd, setProductToAdd] = useState<ProductDetails | null>(null);
  const [addingProductId, setAddingProductId] = useState<EntityId | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Fail closed until the real owner-wide pharmacy status summary is available.
  const [hasEligiblePharmacy, setHasEligiblePharmacy] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const reloadStatistics = () => {
    setIsProductStatisticsLoading(true);
    setRefreshVersion((version) => version + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyStatistics({ signal: controller.signal })
      .then((summary) => {
        if (!controller.signal.aborted) {
          setHasEligiblePharmacy(summary.active + summary.onModeration > 0);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasEligiblePharmacy(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCheckingEligibility(false);
      });

    return () => controller.abort();
  }, [refreshVersion]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategoryOptions() {
      try {
        const options = await getProductCategories({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setCategoryDirectory(options);
      } catch {
        // Keep the neutral fallback; product data has its own resource state.
      }
    }

    void loadCategoryOptions();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProductStatistics() {
      try {
        const nextStatistics = await getOwnerCatalogStatistics({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProductStatistics(nextStatistics);
          setIsProductStatisticsUnavailable(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsProductStatisticsUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsProductStatisticsLoading(false);
      }
    }

    void loadProductStatistics();

    return () => {
      controller.abort();
    };
  }, [refreshVersion]);

  const debouncedName = useDebouncedValue(filters.name, 450);
  const debouncedArticle = useDebouncedValue(filters.article, 450);

  const requestFilters = useMemo<AllProductsFilterState>(
    () => ({
      createdDate: filters.createdDate,
      productId: filters.productId,
      name: debouncedName,
      article: debouncedArticle,
      category: filters.category,
      status: filters.status,
      addedToMyPharmacy: filters.addedToMyPharmacy,
    }),
    [
      debouncedArticle,
      debouncedName,
      filters.addedToMyPharmacy,
      filters.productId,
      filters.category,
      filters.createdDate,
      filters.status,
    ]
  );

  const queryParams = useMemo(
    () => getProductsQueryParams(requestFilters, rowsPerPage, currentPage),
    [currentPage, requestFilters, rowsPerPage]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await getOwnerCatalogProducts(queryParams, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const normalizedTotalPages = Math.max(1, response.totalPages);

        const normalizedPage = clampProductListPage(
          currentPage,
          response.total,
          rowsPerPage
        );

        if (normalizedPage !== currentPage) {
          setCurrentPage(normalizedPage);
          return;
        }

        setProducts([...response.items]);
        setTotalProducts(response.total);
        setEarliestCreatedAt(response.earliestCreatedAt);
        setTotalPages(normalizedTotalPages);
      } catch {
        if (controller.signal.aborted) return;

        setLoadError(
          'Products could not be loaded. Please try again in a moment.'
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [currentPage, queryParams, refreshVersion, rowsPerPage]);

  const debouncedFilters = useDebouncedValue(filters, 450);

  useEffect(() => {
    if (debouncedFilters !== filters) return;

    const nextPath = buildAllProductsPath(debouncedFilters, {
      page: currentPage,
      perPage: rowsPerPage,
    });

    if (pathname === nextPath) return;

    router.replace(nextPath, { scroll: false });
  }, [currentPage, debouncedFilters, filters, pathname, router, rowsPerPage]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.createdDate.from || filters.createdDate.to),
    Boolean(filters.productId),
    Boolean(filters.name.trim()),
    Boolean(filters.article.trim()),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.addedToMyPharmacy !== 'all'
  );

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

  const handleConfirmAddProduct = async () => {
    if (!productToAdd || isCheckingEligibility || !hasEligiblePharmacy) return;

    setAddingProductId(productToAdd.id);

    try {
      const response = await addOwnerCatalogProduct(productToAdd.id);

      const leavesCurrentResultSet = filters.addedToMyPharmacy === 'no';

      const nextTotalProducts = leavesCurrentResultSet
        ? Math.max(0, totalProducts - 1)
        : totalProducts;

      const nextPage = clampProductListPage(
        currentPage,
        nextTotalProducts,
        rowsPerPage
      );

      setProducts((currentProducts) =>
        leavesCurrentResultSet
          ? currentProducts.filter(
              (product) => product.id !== response.product.id
            )
          : currentProducts.map((product) =>
              product.id === response.product.id
                ? { ...response.product, isAddedToOwner: true }
                : product
            )
      );

      setTotalProducts(nextTotalProducts);
      setCurrentPage(nextPage);
      setProductToAdd(null);
      reloadStatistics();

      toast.success(
        response.message || 'Product added to your active pharmacies.'
      );
    } catch (addError) {
      toast.error(getAddProductErrorMessage(addError));
    } finally {
      setAddingProductId(null);
    }
  };

  const activeStatisticKeys: AllProductStatisticsKey[] = [];

  if (filters.status === 'active') activeStatisticKeys.push('active');
  if (filters.status === 'blocked') activeStatisticKeys.push('blocked');

  if (filters.addedToMyPharmacy === 'yes') {
    activeStatisticKeys.push('addedToPharmacy');
  }

  if (filters.addedToMyPharmacy === 'no') {
    activeStatisticKeys.push('notAddedToPharmacy');
  }

  const getProductStatisticHref = (key: AllProductStatisticsKey) => {
    const nextFilters: AllProductsFilterState =
      key === 'active' || key === 'blocked'
        ? {
            ...filters,
            status: filters.status === key ? 'all' : key,
          }
        : {
            ...filters,
            addedToMyPharmacy:
              filters.addedToMyPharmacy ===
              (key === 'addedToPharmacy' ? 'yes' : 'no')
                ? 'all'
                : key === 'addedToPharmacy'
                  ? 'yes'
                  : 'no',
          };

    return buildAllProductsPath(nextFilters, {
      page: 1,
      perPage: rowsPerPage,
    });
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

        <div className={css.productStatistics}>
          {isProductStatisticsLoading ? (
            <StatsLoadingSkeleton
              count={4}
              columns={4}
              tabletColumns={2}
              label="Loading all product statistics"
            />
          ) : isProductStatisticsUnavailable ? (
            <ProfileResourceState
              variant="error"
              title="Product statistics could not be loaded"
              description="The product statistics are temporarily unavailable."
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={reloadStatistics}
            />
          ) : (
            <AllProductStatistics
              counts={productStatistics}
              activeKeys={activeStatisticKeys}
              getStatisticHref={getProductStatisticHref}
            />
          )}
        </div>
      </section>

      <section
        className={css.heroCard}
        aria-label="Search and filter all products"
      >
        <div className={css.searchGrid}>
          <OwnerProductSearch
            value={filters.productId}
            onChange={(productId) =>
              handleFiltersChange({
                ...filters,
                productId,
                name: '',
                article: '',
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
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="all-products-rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            />
          </div>

          <CountLabel
            className={css.countLabel}
            shown={products.length}
            total={totalProducts}
            label="products"
            fullWidthOnMobile
          />
        </div>

        {loadError ? (
          <div role="alert">
            <StatusBanner
              tone="danger"
              title="Products are temporarily unavailable"
              message={loadError}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setRefreshVersion((version) => version + 1)}
            >
              Retry products
            </Button>
          </div>
        ) : null}

        {!isCheckingEligibility && !hasEligiblePharmacy ? (
          <p role="note" className={css.addEligibilityNotice}>
            To add products, at least one of your pharmacies must be Active or
            On moderation.
          </p>
        ) : null}

        <AllProductsTable
          products={products}
          categoryDirectory={categoryDirectory}
          isLoading={isLoading}
          isAddActionDisabled={isCheckingEligibility || !hasEligiblePharmacy}
          addingProductId={addingProductId}
          onAddProduct={setProductToAdd}
          emptyMessage={
            loadError
              ? 'Products are temporarily unavailable.'
              : hasActiveFilters
                ? 'No products found for the selected filters.'
                : 'No active or blocked Admin products are available yet.'
          }
        />

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          ariaLabel="All products pagination"
          onPageChange={setCurrentPage}
        />
      </section>

      <OwnerAddProductConfirmation
        isOpen={Boolean(productToAdd) && hasEligiblePharmacy}
        productName={productToAdd?.name}
        isLoading={Boolean(addingProductId)}
        onConfirm={() => void handleConfirmAddProduct()}
        onCancel={() => {
          if (!addingProductId) setProductToAdd(null);
        }}
      />

      {isFiltersOpen ? (
        <AllProductsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
          categoryOptions={categoryOptions}
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
