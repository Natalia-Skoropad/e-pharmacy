'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, PackageCheck, Trash2 } from 'lucide-react';

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
  parseOwnProductsSegments,
  parseOwnProductsPaginationSegments,
  buildOwnProductsPath,
  buildEmbeddedOwnProductsPath,
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
  embeddedPharmacyId?: string;
}>;

//===================================================================

function OwnerOwnProductsPageContent({
  initialFilters = DEFAULT_OWN_PRODUCTS_FILTERS,
  initialPagination = DEFAULT_OWN_PRODUCTS_PAGINATION,
  embeddedPharmacyId,
}: OwnerOwnProductsPageContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  // Derive the registry state from the current route. Next.js can preserve
  // this component between filter routes, including reset and Back/Forward.
  const routeState = useMemo(() => {
    const base = embeddedPharmacyId
      ? `/pharmacy/pharmacies/${embeddedPharmacyId}/products`
      : '/pharmacy/products';

    if (pathname === base || pathname.startsWith(`${base}/`)) {
      const segments =
        pathname === base ? [] : pathname.slice(base.length + 1).split('/');

      return {
        filters: {
          ...parseOwnProductsSegments({ filters: segments }),
          ...(embeddedPharmacyId ? { pharmacyId: embeddedPharmacyId } : {}),
        },

        pagination: parseOwnProductsPaginationSegments({ filters: segments }),
      };
    }

    return {
      filters: {
        ...initialFilters,
        pharmacyId: embeddedPharmacyId ?? initialFilters.pharmacyId,
      },
      pagination: initialPagination,
    };
  }, [embeddedPharmacyId, initialFilters, initialPagination, pathname]);

  const filters = routeState.filters;
  const page = routeState.pagination.page;
  const rowsPerPage: RowsPerPageValue = routeState.pagination.perPage;

  const navigate = (
    next: OwnProductsFilterState,
    nextPage = 1,
    nextPerPage: RowsPerPageValue = rowsPerPage
  ) => {
    const nextPath = embeddedPharmacyId
      ? buildEmbeddedOwnProductsPath(embeddedPharmacyId, next, {
          page: nextPage,
          perPage: nextPerPage,
        })
      : buildOwnProductsPath(next, { page: nextPage, perPage: nextPerPage });

    if (nextPath === pathname) return;

    router.push(nextPath, { scroll: false });
  };

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

  const queryParams = useMemo(
    () => ({
      page,
      perPage: rowsPerPage,
      pharmacyId: filters.pharmacyId || undefined,
      productId: filters.productId || undefined,
      name: filters.name || undefined,
      article: filters.article || undefined,

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

    [page, rowsPerPage, filters]
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
          router.replace(
            embeddedPharmacyId
              ? buildEmbeddedOwnProductsPath(embeddedPharmacyId, filters, {
                  page: normalizedPage,
                  perPage: rowsPerPage,
                })
              : buildOwnProductsPath(filters, {
                  page: normalizedPage,
                  perPage: rowsPerPage,
                }),
            { scroll: false }
          );
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
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);

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
  }, [
    queryParams,
    page,
    rowsPerPage,
    requestKey,
    refreshVersion,
    embeddedPharmacyId,
    filters,
    router,
  ]);

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
    navigate(
      embeddedPharmacyId ? { ...next, pharmacyId: embeddedPharmacyId } : next
    );
  };

  const resetFilters = () =>
    navigate({
      ...DEFAULT_OWN_PRODUCTS_FILTERS,
      pharmacyId: filters.pharmacyId,
    });

  const statisticHref = (key: OwnProductStatisticsKey) => {
    const stock: OwnProductsFilterState['stock'] =
      key === 'outOfStock' ? 'empty' : key === 'inStock' ? 'in-stock' : key;

    const nextFilters = {
      ...filters,
      stock: filters.stock === stock ? ('all' as const) : stock,
    };

    return embeddedPharmacyId
      ? buildEmbeddedOwnProductsPath(embeddedPharmacyId, nextFilters, {
          page: 1,
          perPage: rowsPerPage,
        })
      : buildOwnProductsPath(nextFilters, { page: 1, perPage: rowsPerPage });
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
    <section
      className={`${css.page} ${embeddedPharmacyId ? css.embeddedPage : ''}`}
      aria-label="Own products"
    >
      <section
        className={`${css.card} ${embeddedPharmacyId ? css.embeddedCard : ''}`}
      >
        {!embeddedPharmacyId ? (
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
        ) : null}

        {!embeddedPharmacyId ? (
          <div className={css.pharmacySelector}>
            <OwnedPharmacySearch
              id="own-products-pharmacy-search"
              label="Select pharmacy"
              value={filters.pharmacyId}
              explainStatistics
              onChange={(pharmacyId) =>
                changeFilters({ ...filters, pharmacyId })
              }
            />
          </div>
        ) : null}

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

      <section
        className={`${css.card} ${embeddedPharmacyId ? css.embeddedCard : ''}`}
        aria-label="Search and filter own products"
      >
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

      <section
        className={`${css.card} ${embeddedPharmacyId ? css.embeddedCard : ''}`}
        aria-label="Own products table"
      >
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="own-products-rows-per-page"
              value={rowsPerPage}
              onChange={(perPage: RowsPerPageValue) =>
                navigate(filters, 1, perPage)
              }
            />
          </div>
          {!isLoading && !loadError ? (
            <CountLabel
              className={css.countLabel}
              shown={products.length}
              total={totalProducts}
              label="products"
              fullWidthOnMobile
            />
          ) : null}
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
          onPageChange={(nextPage) => navigate(filters, nextPage)}
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
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
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
    </section>
  );
}

export default OwnerOwnProductsPageContent;
export { OwnerOwnProductsPageContent };
