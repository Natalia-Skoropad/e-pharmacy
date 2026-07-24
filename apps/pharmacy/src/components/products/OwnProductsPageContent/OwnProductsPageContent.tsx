'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, PackageCheck } from 'lucide-react';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { FiltersButton } from '@e-pharmacy/ui/primitives';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  RowsPerPageSelect,
  SearchInput,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';
import type { EntityId } from '@e-pharmacy/types/primitives';
import { getPharmacyProductsPath } from '@e-pharmacy/config/pharmacy';

import {
  OwnProductStatisticsCounts,
  OwnProductStatisticsKey,
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

import { DEFAULT_OWN_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';
import { buildOwnProductsPath } from '@/lib/products/own-product-paths';
import { getPharmacyOwnProductStatistics } from '@/lib/products/product-statistics';
import { getPharmacyProductsFilterPath } from '@/lib/layout/routes';

import { OwnProductStatistics } from '@/components/statistics';
import { StatusBanner } from '@/components/common/StatusPresentation';
import { OwnProductsFiltersDrawer } from '@/components/products/OwnProductsFiltersDrawer';
import { OwnProductsTable } from '@/components/products/OwnProductsTable';

import css from './OwnProductsPageContent.module.css';

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
  const [totalPages, setTotalPages] = useState(0);
  const [earliestCreatedAt, setEarliestCreatedAt] = useState<string | null>(
    null
  );

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

        setProducts([...response.items]);
        setTotalProducts(response.total);
        setTotalPages(response.totalPages);
        setEarliestCreatedAt(response.earliestCreatedAt);
      } catch {
        if (!isMounted) return;

        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
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

  const activeFiltersCount = countTrueConditions(
    Boolean(filters.createdDate.from || filters.createdDate.to),
    Boolean(filters.name.trim()),
    Boolean(filters.article.trim()),
    filters.category !== 'all',
    filters.status !== 'all',
    filters.stock !== 'all'
  );
  const hasActiveFilters = activeFiltersCount > 0;

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
                items={[
                  {
                    title: 'Reserved products',
                    description:
                      'Units held for orders with New or In progress status. They remain physically in stock but cannot be added to another order.',
                  },
                  {
                    title: 'Available products',
                    description:
                      'Units that can be sold now: products in stock minus reserved products. They become available after an arrival or when a reservation is reduced or released.',
                  },
                ]}
              />
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

        <PaginationView
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
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
