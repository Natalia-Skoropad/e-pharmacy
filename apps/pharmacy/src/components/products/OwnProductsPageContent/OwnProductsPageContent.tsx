'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { OwnProductStatistics, StatusBanner } from '@e-pharmacy/ui/statistics';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type { EntityId } from '@e-pharmacy/types';

import {
  DEFAULT_OWN_PRODUCT_STATISTICS,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import { getMyPharmacyProfile, getPharmacyProducts } from '@/lib/api/browser';

import type {
  PharmacyProductRow,
  PharmacyProductsQueryParams,
} from '@/lib/products/products';

import {
  DEFAULT_OWN_PRODUCTS_FILTERS,
  type OwnProductsFilterState,
} from '@/lib/products/own-products-filters';

import { buildOwnProductsPath } from '@/lib/products/own-product-paths';
import { getPharmacyOwnProductStatistics } from '@/lib/products/product-statistics';

import {
  getPharmacyProductsFilterPath,
  getPharmacyProductsPath,
} from '@/lib/layout/routes';

import { OwnProductsFiltersDrawer } from '@/components/products/OwnProductsFiltersDrawer';
import { OwnProductsTable } from '@/components/products/OwnProductsTable';

import css from './OwnProductsPageContent.module.css';

//===================================================================

function getActiveFiltersCount(filters: OwnProductsFilterState): number {
  return [
    filters.createdDate.from || filters.createdDate.to,
    filters.name.trim(),
    filters.article.trim(),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.stock !== 'all',
  ].filter(Boolean).length;
}

//===================================================================

function getProductsQueryParams(
  filters: OwnProductsFilterState,
  rowsPerPage: RowsPerPageValue,
  pharmacyId: EntityId
): PharmacyProductsQueryParams {
  return {
    page: 1,
    perPage: rowsPerPage,
    pharmacyId,
    addedFrom: filters.createdDate.from || undefined,
    addedTo: filters.createdDate.to || undefined,
    name: filters.name.trim() || undefined,
    article: filters.article.trim() || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    status: filters.status === 'all' ? undefined : filters.status,
    stock: filters.stock === 'all' ? undefined : filters.stock,
  };
}

//===================================================================

type OwnProductsPageContentProps = Readonly<{
  initialFilters?: OwnProductsFilterState;
}>;

//===================================================================

function getOwnProductStatisticHref(key: OwnProductStatisticsKey) {
  if (key === 'reserved') {
    return getPharmacyProductsFilterPath({ stock: 'reserved' });
  }

  if (key === 'available') {
    return getPharmacyProductsFilterPath({ stock: 'available' });
  }

  if (key === 'outOfStock') {
    return getPharmacyProductsFilterPath({ stock: 'empty' });
  }

  return getPharmacyProductsPath();
}

//===================================================================

function OwnProductsPageContent({
  initialFilters = DEFAULT_OWN_PRODUCTS_FILTERS,
}: OwnProductsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] =
    useState<OwnProductsFilterState>(initialFilters);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [products, setProducts] = useState<PharmacyProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productStatistics, setProductStatistics] =
    useState<OwnProductStatisticsCounts>(DEFAULT_OWN_PRODUCT_STATISTICS);
  const [pharmacyId, setPharmacyId] = useState<EntityId | null>(null);
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

        setPharmacyId(response.pharmacy.id);
      } catch {
        if (!isMounted) return;

        setPharmacyId(null);
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
    if (!pharmacyId) return;

    let isMounted = true;

    async function loadProductStatistics(currentPharmacyId: EntityId) {
      try {
        const nextStatistics =
          await getPharmacyOwnProductStatistics(currentPharmacyId);

        if (isMounted) setProductStatistics(nextStatistics);
      } catch {
        if (isMounted) setProductStatistics(DEFAULT_OWN_PRODUCT_STATISTICS);
      }
    }

    void loadProductStatistics(pharmacyId);

    return () => {
      isMounted = false;
    };
  }, [pharmacyId]);

  const queryParams = useMemo(
    () =>
      pharmacyId
        ? getProductsQueryParams(filters, rowsPerPage, pharmacyId)
        : null,
    [filters, pharmacyId, rowsPerPage]
  );

  useEffect(() => {
    if (!isProfileLoaded || !queryParams) return;

    let isMounted = true;

    async function loadProducts(params: PharmacyProductsQueryParams) {
      setIsLoading(true);

      try {
        const response = await getPharmacyProducts(params);
        if (!isMounted) return;

        setProducts(response.items);
        setTotalProducts(response.total);
      } catch {
        if (!isMounted) return;

        setProducts([]);
        setTotalProducts(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts(queryParams);

    return () => {
      isMounted = false;
    };
  }, [isProfileLoaded, queryParams]);

  useEffect(() => {
    const nextPath = buildOwnProductsPath(filters);

    if (pathname === nextPath) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(nextPath, { scroll: false });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [filters, pathname, router]);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (nextFilters: OwnProductsFilterState) => {
    setFilters(nextFilters);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_OWN_PRODUCTS_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="own-products-page-title">
      <section className={css.card} aria-labelledby="own-products-page-title">
        <PageHeader
          title="Own products"
          titleId="own-products-page-title"
          icon={<Boxes size={23} aria-hidden="true" />}
        />

        <StatusBanner
          status="new"
          label="New"
          title="Verification is required"
          message="Own products will appear only after verification, when adding products to this pharmacy becomes available."
        />

        <OwnProductStatistics
          className={css.productStatistics}
          counts={productStatistics}
          getStatisticHref={getOwnProductStatisticHref}
        />
      </section>

      <section className={css.card} aria-labelledby="own-products-search">
        <div className={css.searchGrid}>
          <SearchInput
            id="own-products-product-article-search"
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
            id="own-products-product-name-search"
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
              controlsId="own-products-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Own products table">
        <div className={css.toolbar}>
          <RowsPerPageSelect
            id="own-products-rows-per-page"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          />

          <CountLabel
            shown={products.length}
            total={totalProducts}
            label="products"
          />
        </div>

        <OwnProductsTable
          products={products}
          isLoading={!isProfileLoaded || isLoading}
          emptyMessage={
            hasActiveFilters
              ? 'No products found for the selected filters.'
              : 'Your pharmacy has no added products yet.'
          }
        />
      </section>

      {isFiltersOpen ? (
        <OwnProductsFiltersDrawer
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

export default OwnProductsPageContent;
export { OwnProductsPageContent };
