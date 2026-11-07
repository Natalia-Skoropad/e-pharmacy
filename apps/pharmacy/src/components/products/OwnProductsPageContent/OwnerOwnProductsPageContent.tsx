'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, PackageCheck } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatsLoadingSkeleton, StatusBanner } from '@e-pharmacy/ui/statistics';

import type { EntityId } from '@e-pharmacy/types/primitives';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type {
  OwnProductStatisticsCounts,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import { getProductCategories } from '@/lib/api/browser';

import {
  getOwnerOwnProducts,
  getOwnerOwnProductSuggestions,
  removeOwnerOwnProduct,
} from '@/lib/api/browser/owner-own-products.api';

import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import type { PharmacyProductRow } from '@/lib/products/products';
import { DEFAULT_OWN_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';
import { clampProductListPage } from '@/lib/products/product-pagination';

import {
  DEFAULT_OWN_PRODUCTS_FILTERS,
  type OwnProductsFilterState,
} from '@/lib/products/own-products-filters';

import {
  DEFAULT_OWN_PRODUCTS_PAGINATION,
  buildOwnProductsPath,
  type OwnProductsPagination,
} from '@/lib/products/own-product-paths';

import { OwnerProductSearch } from '@/components/all-products/OwnerProductSearch/OwnerProductSearch';
import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { OwnProductStatistics } from '@/components/statistics/OwnProductStatistics/OwnProductStatistics';
import { OwnProductsFiltersDrawer } from '@/components/products/OwnProductsFiltersDrawer';
import { OwnProductsTable } from '@/components/products/OwnProductsTable';

import css from './OwnProductsPageContent.module.css';

//===================================================================

type OwnerOwnProductsPageContentProps = Readonly<{
  initialFilters?: OwnProductsFilterState;
  initialPagination?: OwnProductsPagination;
}>;

//===================================================================

function OwnerOwnProductsPageContent({
  initialFilters = DEFAULT_OWN_PRODUCTS_FILTERS,
  initialPagination = DEFAULT_OWN_PRODUCTS_PAGINATION,
}: OwnerOwnProductsPageContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const [filters, setFilters] =
    useState<OwnProductsFilterState>(initialFilters);

  const [page, setPage] = useState(initialPagination.page);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(
    initialPagination.perPage
  );

  const [products, setProducts] = useState<PharmacyProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

  const [statistics, setStatistics] = useState<OwnProductStatisticsCounts>(
    DEFAULT_OWN_PRODUCT_STATISTICS
  );

  const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastCompletedKey, setLastCompletedKey] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [categoryReference, setCategoryReference] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const [productToRemove, setProductToRemove] =
    useState<PharmacyProductRow | null>(null);

  const [removingProductId, setRemovingProductId] = useState<EntityId | null>(
    null
  );

  useEffect(() => {
    const controller = new AbortController();

    void getProductCategories({ signal: controller.signal })
      .then((categories) => {
        if (!controller.signal.aborted) setCategoryReference(categories);
      })
      .catch(() => {
        /* Product list retains its own error handling. */
      });

    return () => controller.abort();
  }, []);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },

      ...categoryReference.map((category) => ({
        value: category.slug,
        label: category.name,
        icon: category.icon,
      })),
    ],
    [categoryReference]
  );

  const categoryMap = useMemo(
    () =>
      new Map(
        categoryReference.flatMap(
          (category) =>
            [
              [category.id, category],
              [category.slug, category],
            ] as const
        )
      ),
    [categoryReference]
  );

  const debouncedName = useDebouncedValue(filters.name, 350);
  const debouncedArticle = useDebouncedValue(filters.article, 350);

  const queryParams = useMemo(
    () => ({
      page,
      perPage: rowsPerPage,
      pharmacyId: filters.pharmacyId || undefined,
      productId: filters.productId || undefined,
      nameKeyword: debouncedName || undefined,
      articleKeyword: debouncedArticle || undefined,

      addedFrom: isCalendarDateString(filters.createdDate.from)
        ? filters.createdDate.from
        : undefined,

      addedTo: isCalendarDateString(filters.createdDate.to)
        ? filters.createdDate.to
        : undefined,

      category: filters.category === 'all' ? undefined : filters.category,
      status: filters.status === 'all' ? undefined : filters.status,
      stock: filters.stock === 'all' ? undefined : filters.stock,
      sort: 'newest' as const,
    }),

    [page, rowsPerPage, filters, debouncedName, debouncedArticle]
  );

  const requestKey = useMemo(
    () => JSON.stringify({ queryParams, refreshVersion }),
    [queryParams, refreshVersion]
  );

  const isLoading = requestKey !== lastCompletedKey;
  const statisticsLoading = isLoading;

  useEffect(() => {
    const controller = new AbortController();

    void getOwnerOwnProducts(queryParams, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        const normalizedPage = clampProductListPage(
          page,
          response.total,
          rowsPerPage
        );

        if (normalizedPage !== page) {
          setPage(normalizedPage);
          return;
        }

        setProducts([...response.items]);
        setTotalProducts(response.total);
        setTotalPages(Math.max(1, response.totalPages));
        setEarliestCreatedAt(response.earliestCreatedAt);
        setStatistics(response.statistics);
        setStatisticsUnavailable(false);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setStatisticsUnavailable(true);

        setLoadError(
          getSafeApiErrorMessage(
            error,
            'Own products could not be loaded. Please try again.'
          )
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLastCompletedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [queryParams, page, rowsPerPage, requestKey, refreshVersion]);

  const debouncedFilters = useDebouncedValue(filters, 350);

  useEffect(() => {
    if (debouncedFilters !== filters) return;

    const nextPath = buildOwnProductsPath(debouncedFilters, {
      page,
      perPage: rowsPerPage,
    });

    if (pathname !== nextPath) router.replace(nextPath, { scroll: false });
  }, [debouncedFilters, filters, page, pathname, router, rowsPerPage]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.productId),
    Boolean(filters.name.trim()),
    Boolean(filters.article.trim()),
    Boolean(filters.createdDate.from || filters.createdDate.to),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.stock !== 'all'
  );

  const hasActiveFilters = activeFiltersCount > 0;

  const changeFilters = (next: OwnProductsFilterState) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () =>
    changeFilters({
      ...DEFAULT_OWN_PRODUCTS_FILTERS,
      pharmacyId: filters.pharmacyId,
    });

  const statisticHref = (key: OwnProductStatisticsKey) => {
    const stock =
      key === 'outOfStock' ? 'empty' : key === 'inStock' ? 'in-stock' : key;

    return buildOwnProductsPath(
      {
        ...filters,
        stock: filters.stock === stock ? 'all' : stock,
      },
      { page: 1, perPage: rowsPerPage }
    );
  };

  const refresh = () => {
    setRefreshVersion((value) => value + 1);
  };

  const removeProduct = async () => {
    if (!productToRemove || !filters.pharmacyId) return;

    setRemovingProductId(productToRemove.id);

    try {
      await removeOwnerOwnProduct(productToRemove.id, filters.pharmacyId);

      setProductToRemove(null);
      toast.success('Product removed from the selected pharmacy.');
      refresh();
    } catch (error) {
      toast.error(
        getSafeApiErrorMessage(error, 'Could not remove the product.')
      );
    } finally {
      setRemovingProductId(null);
    }
  };

  return (
    <main className={css.page} aria-labelledby="own-products-page-title">
      <section className={css.card}>
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              Own products
              <InfoTooltip
                label="How do reserved and available products work?"
                title="Reserved and available products"
                icon={<PackageCheck size={20} />}
                items={[
                  {
                    title: 'Reserved products',
                    description:
                      'Units held for New or In progress orders. They are in stock but not available for another order.',
                  },
                  {
                    title: 'Available products',
                    description:
                      'Units that can be sold now: stock minus reservations.',
                  },
                ]}
              />
            </span>
          }
          titleId="own-products-page-title"
          icon={<Boxes size={23} aria-hidden="true" />}
        />

        <div className={css.pharmacySelector}>
          <OwnedPharmacySearch
            id="own-products-pharmacy-search"
            label="Select pharmacy"
            value={filters.pharmacyId}
            explainStatistics
            onChange={(pharmacyId) => changeFilters({ ...filters, pharmacyId })}
          />
        </div>

        <div className={css.ownerStatsArea}>
          {statisticsLoading ? (
            <StatsLoadingSkeleton
              count={4}
              columns={4}
              tabletColumns={2}
              label="Loading own product statistics"
            />
          ) : statisticsUnavailable ? (
            <ProfileResourceState
              variant="error"
              title="Product statistics could not be loaded"
              description="The product statistics are temporarily unavailable."
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={refresh}
            />
          ) : (
            <OwnProductStatistics
              className={css.productStatistics}
              counts={statistics}
              activeKeys={
                filters.stock === 'all'
                  ? []
                  : [
                      filters.stock === 'empty'
                        ? 'outOfStock'
                        : filters.stock === 'in-stock'
                          ? 'inStock'
                          : filters.stock,
                    ]
              }
              getStatisticHref={statisticHref}
            />
          )}
        </div>
      </section>

      <section className={css.card} aria-label="Search and filter own products">
        <div className={css.ownerSearchGrid}>
          <OwnerProductSearch
            id="own-products-product-search"
            value={filters.productId}
            pharmacyId={filters.pharmacyId}
            loadProducts={getOwnerOwnProductSuggestions}
            description="Find a product already added to your pharmacies by article, name or product ID. Suggestions are loaded progressively."
            onChange={(productId) =>
              changeFilters({ ...filters, productId, name: '', article: '' })
            }
          />
          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="own-products-filters-panel"
              isExpanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Own products table">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="own-products-rows-per-page"
              value={rowsPerPage}
              onChange={(perPage: RowsPerPageValue) => {
                setRowsPerPage(perPage);
                setPage(1);
              }}
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

        {loadError && (
          <div role="alert">
            <StatusBanner
              tone="danger"
              title="Own products are temporarily unavailable"
              message={loadError}
            />
            <Button size="sm" variant="secondary" onClick={refresh}>
              Retry products
            </Button>
          </div>
        )}

        <OwnProductsTable
          products={products}
          isLoading={isLoading}
          emptyMessage={
            loadError
              ? 'Products are temporarily unavailable.'
              : hasActiveFilters
                ? 'No products match the selected filters.'
                : 'No products have been added to your pharmacies yet.'
          }
          isAllPharmacies={!filters.pharmacyId}
          categoryReference={categoryMap}
          removingProductId={removingProductId}
          onRemoveProduct={filters.pharmacyId ? setProductToRemove : undefined}
        />
        <PaginationView
          currentPage={page}
          totalPages={totalPages}
          ariaLabel="Own products pagination"
          onPageChange={setPage}
        />
      </section>

      <ConfirmationModal
        isOpen={Boolean(productToRemove && filters.pharmacyId)}
        title="Remove product from pharmacy?"
        description={
          productToRemove
            ? `Remove ${productToRemove.name} from the selected pharmacy? Existing orders prevent removal.`
            : undefined
        }
        confirmLabel="Remove product"
        isLoading={Boolean(removingProductId)}
        onConfirm={() => void removeProduct()}
        onCancel={() => {
          if (!removingProductId) setProductToRemove(null);
        }}
      />

      {filtersOpen && (
        <OwnProductsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
          categoryOptions={categoryOptions}
          onChange={changeFilters}
          onClose={() => setFiltersOpen(false)}
          onReset={resetFilters}
        />
      )}
    </main>
  );
}

export default OwnerOwnProductsPageContent;
export { OwnerOwnProductsPageContent };
