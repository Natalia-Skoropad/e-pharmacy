'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, PackageCheck } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  InfoTooltip,
  Pagination,
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { useToast } from '@e-pharmacy/ui/feedback';

import { OwnProductStatistics, StatusBanner } from '@e-pharmacy/ui/statistics';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type { EntityId, PharmacyStatus } from '@e-pharmacy/types';

import {
  DEFAULT_OWN_PRODUCT_STATISTICS,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import {
  getMyPharmacyProfile,
  getPharmacyProducts,
  removeProductFromMyPharmacy,
} from '@/lib/api/browser';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

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
  pharmacyId: EntityId,
  page: number
): PharmacyProductsQueryParams {
  return {
    page,
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

function getRemoveProductErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  return 'Could not remove product from your pharmacy.';
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

  if (key === 'inStock') {
    return getPharmacyProductsFilterPath({ stock: 'in-stock' });
  }

  return getPharmacyProductsPath();
}

//===================================================================

function OwnProductsPageContent({
  initialFilters = DEFAULT_OWN_PRODUCTS_FILTERS,
}: OwnProductsPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const pathname = usePathname();

  const [filters, setFilters] =
    useState<OwnProductsFilterState>(initialFilters);

  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<PharmacyProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(null);

  const [productStatistics, setProductStatistics] =
    useState<OwnProductStatisticsCounts>(DEFAULT_OWN_PRODUCT_STATISTICS);

  const [pharmacyId, setPharmacyId] = useState<EntityId | null>(null);

  const [pharmacyStatus, setPharmacyStatus] = useState<PharmacyStatus | null>(
    null
  );

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [productToRemove, setProductToRemove] =
    useState<PharmacyProductRow | null>(null);

  const [removingProductId, setRemovingProductId] = useState<EntityId | null>(
    null
  );

  const [refreshVersion, setRefreshVersion] = useState(0);

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
        setPharmacyStatus(response.pharmacy.status);
      } catch {
        if (!isMounted) return;

        setPharmacyId(null);
        setPharmacyStatus('new');
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
  }, [pharmacyId, refreshVersion]);

  const queryParams = useMemo(
    () =>
      pharmacyId
        ? getProductsQueryParams(filters, rowsPerPage, pharmacyId, currentPage)
        : null,
    [currentPage, filters, pharmacyId, rowsPerPage]
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
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (!isMounted) return;

        setProducts([]);
        setTotalProducts(0);
        setEarliestCreatedAt(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts(queryParams);

    return () => {
      isMounted = false;
    };
  }, [isProfileLoaded, queryParams, refreshVersion]);

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
  const totalPages = Math.ceil(totalProducts / rowsPerPage);

  const handleFiltersChange = (nextFilters: OwnProductsFilterState) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_OWN_PRODUCTS_FILTERS);
    setCurrentPage(1);
  };

  const handleRemoveProduct = (product: PharmacyProductRow) => {
    setProductToRemove(product);
  };

  const handleRemoveProductConfirm = async () => {
    if (!productToRemove) return;

    setRemovingProductId(productToRemove.id);

    try {
      const response = await removeProductFromMyPharmacy(productToRemove.id);

      setProducts((current) =>
        current.filter((product) => product.id !== productToRemove.id)
      );
      setTotalProducts((current) => Math.max(0, current - 1));
      setProductToRemove(null);
      setRefreshVersion((current) => current + 1);
      toast.success(response.message || 'Product was removed.');
    } catch (error) {
      toast.error(getRemoveProductErrorMessage(error));
    } finally {
      setRemovingProductId(null);
    }
  };

  const bannerStatus = getLockedFeatureBannerStatus(pharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;

  return (
    <main className={css.page} aria-labelledby="own-products-page-title">
      <section className={css.card} aria-labelledby="own-products-page-title">
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              Own products
              <InfoTooltip
                label="How do reserved and available products work?"
                title="Reserved and available products"
                icon={<PackageCheck size={20} strokeWidth={2} />}
              >
                <strong>Reserved products</strong> are units held for orders
                with New or In progress status. They remain physically in stock
                but cannot be added to another order.
                <br />
                <br />
                <strong>Available products</strong> are units that can be sold
                now: products in stock minus reserved products. They become
                available after a stock arrival or when an order reservation is
                reduced or released.
              </InfoTooltip>
            </span>
          }
          titleId="own-products-page-title"
          icon={<Boxes size={23} aria-hidden="true" />}
        />

        {bannerStatus ? (
          <StatusBanner
            status={bannerStatus}
            label={bannerLabel ?? undefined}
            title="Verification is required"
            message="Own products will appear only after verification, when adding products to this pharmacy becomes available."
          />
        ) : null}

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
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="own-products-rows-per-page"
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

        <OwnProductsTable
          products={products}
          isLoading={!isProfileLoaded || isLoading}
          emptyMessage={
            hasActiveFilters
              ? 'No products found for the selected filters.'
              : 'Your pharmacy has no added products yet.'
          }
          removingProductId={removingProductId}
          onRemoveProduct={handleRemoveProduct}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={(page) => String(page)}
          renderLink={({
            href,
            className,
            children,
            'aria-label': ariaLabel,
          }) => (
            <button
              className={className}
              type="button"
              aria-label={ariaLabel}
              onClick={() => setCurrentPage(Number(href))}
            >
              {children}
            </button>
          )}
        />
      </section>

      <ConfirmationModal
        isOpen={Boolean(productToRemove)}
        title="Remove product from pharmacy?"
        description={
          productToRemove
            ? `Remove ${productToRemove.name} from your own products? This is possible only while there are no orders for this product.`
            : 'Remove this product from your own products?'
        }
        confirmLabel="Remove product"
        isLoading={Boolean(removingProductId)}
        onConfirm={() => void handleRemoveProductConfirm()}
        onCancel={() => {
          if (!removingProductId) setProductToRemove(null);
        }}
      />

      {isFiltersOpen ? (
        <OwnProductsFiltersDrawer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          minDate={earliestCreatedAt ?? undefined}
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
