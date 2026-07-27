'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PackageSearch } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { FiltersButton } from '@e-pharmacy/ui/primitives';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import type { EntityId } from '@e-pharmacy/types/primitives';

import type {
  PharmacyProductsQueryParams,
  ProductDetails,
} from '@e-pharmacy/types/products';

import {
  AllProductStatisticsCounts,
  AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import { addProductToMyPharmacy, getProducts } from '@/lib/api/browser';

import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';

import {
  DEFAULT_ALL_PRODUCTS_FILTERS,
  type AllProductsFilterState,
} from '@/lib/products/all-products-filters';

import { DEFAULT_ALL_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';
import { buildAllProductsPath } from '@/lib/products/all-product-paths';
import { getPharmacyAllProductStatistics } from '@/lib/products/product-statistics';

import { AllProductStatistics } from '@/components/statistics';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';
import { AllProductsFiltersDrawer } from '@/components/all-products/AllProductsFiltersDrawer';
import { AllProductsTable } from '@/components/all-products/AllProductsTable';

import css from './AllProductsPageContent.module.css';

//===================================================================

function getProductsQueryParams(
  filters: AllProductsFilterState,
  rowsPerPage: RowsPerPageValue,
  page: number,
  currentPharmacyId: EntityId | null
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

function getAddProductErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  return 'Could not add product. Please try again.';
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
  const toast = useToast();
  const { profile: pharmacyProfile, isLoading: isProfileLoading } =
    usePharmacyProfile();
  const currentPharmacyId = pharmacyProfile?.id ?? null;
  const pharmacyStatus = pharmacyProfile?.status ?? null;
  const isProfileLoaded = !isProfileLoading;

  const [filters, setFilters] =
    useState<AllProductsFilterState>(initialFilters);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );
  const [totalPages, setTotalPages] = useState(1);

  const [productStatistics, setProductStatistics] =
    useState<AllProductStatisticsCounts>(DEFAULT_ALL_PRODUCT_STATISTICS);

  const [productToAdd, setProductToAdd] = useState<ProductDetails | null>(null);
  const [addingProductId, setAddingProductId] = useState<EntityId | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    if (!currentPharmacyId) return;

    const controller = new AbortController();

    async function loadProductStatistics(pharmacyId: EntityId) {
      try {
        const nextStatistics = await getPharmacyAllProductStatistics(
          pharmacyId,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) setProductStatistics(nextStatistics);
      } catch {
        if (!controller.signal.aborted) {
          setProductStatistics(DEFAULT_ALL_PRODUCT_STATISTICS);
        }
      }
    }

    void loadProductStatistics(currentPharmacyId);

    return () => {
      controller.abort();
    };
  }, [currentPharmacyId, refreshVersion]);

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

    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await getProducts(queryParams, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setProducts([...response.items]);
        setTotalProducts(response.total);
        setEarliestCreatedAt(response.earliestCreatedAt);
        setTotalPages(Math.max(1, response.totalPages));
      } catch {
        if (controller.signal.aborted) return;

        setProducts([]);
        setTotalProducts(0);
        setEarliestCreatedAt(null);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [isProfileLoaded, queryParams, refreshVersion]);

  const debouncedFilters = useDebouncedValue(filters, 450);

  useEffect(() => {
    if (debouncedFilters !== filters) return;

    const nextPath = buildAllProductsPath(debouncedFilters);
    if (pathname === nextPath) return;

    router.replace(nextPath, { scroll: false });
  }, [debouncedFilters, filters, pathname, router]);

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.createdDate.from || filters.createdDate.to),
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

  const bannerStatus = getLockedFeatureBannerStatus(pharmacyStatus);

  const handleConfirmAddProduct = async () => {
    if (!productToAdd) return;

    setAddingProductId(productToAdd.id);

    try {
      const response = await addProductToMyPharmacy(productToAdd.id);

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === response.product.id ? response.product : product
        )
      );
      setProductToAdd(null);
      setRefreshVersion((value) => value + 1);
      toast.success(
        response.message || 'ProductDetails added to your pharmacy.'
      );
    } catch (addError) {
      toast.error(getAddProductErrorMessage(addError));
    } finally {
      setAddingProductId(null);
    }
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

        {bannerStatus ? (
          <StatusBanner
            {...PHARMACY_STATUS_PRESENTATION[bannerStatus]}
            title="Catalog is available in read-only mode"
            message="Active and blocked Admin products are shown here. Adding products to your pharmacy becomes available after Admin verifies your pharmacy profile."
          />
        ) : null}

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
            label="ProductDetails article search"
            value={filters.article}
            placeholder="ProductDetails article"
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
            label="ProductDetails name search"
            value={filters.name}
            placeholder="ProductDetails name"
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
          />
        </div>

        <AllProductsTable
          currentPharmacyId={currentPharmacyId}
          products={products}
          isLoading={!isProfileLoaded || isLoading}
          isAddActionDisabled={Boolean(bannerStatus) || !currentPharmacyId}
          addingProductId={addingProductId}
          onAddProduct={setProductToAdd}
          emptyMessage={
            hasActiveFilters
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

      <ConfirmationModal
        isOpen={Boolean(productToAdd)}
        title="Add product to pharmacy?"
        description="Are you sure you want to add this product to your pharmacy?"
        confirmLabel="Add to pharmacy"
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
