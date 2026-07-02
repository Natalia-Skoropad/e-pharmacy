'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes } from 'lucide-react';

import {
  CountLabel,
  FiltersButton,
  RowsPerPageSelect,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import type { EntityId } from '@e-pharmacy/types';

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

import { OwnProductsFiltersDrawer } from '@/components/products/OwnProductsFiltersDrawer';
import { OwnProductsTable } from '@/components/products/OwnProductsTable';

import css from './OwnProductsPageContent.module.css';

//===================================================================

function getActiveFiltersCount(filters: OwnProductsFilterState): number {
  return [
    filters.addedDate.from || filters.addedDate.to,
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
    addedFrom: filters.addedDate.from || undefined,
    addedTo: filters.addedDate.to || undefined,
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

  const resetFilters = () => {
    setFilters(DEFAULT_OWN_PRODUCTS_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="own-products-page-title">
      <div className={css.card}>
        <PageHeader
          title="Own products"
          titleId="own-products-page-title"
          icon={<Boxes size={23} aria-hidden="true" />}
          actions={
            <CountLabel
              shown={products.length}
              total={totalProducts}
              label="products"
            />
          }
        />

        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Verification is required"
            message="Own products will appear only after verification, when adding products to this pharmacy becomes available."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarActions}>
              <RowsPerPageSelect
                id="own-products-rows-per-page"
                value={rowsPerPage}
                onChange={setRowsPerPage}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="own-products-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
              />
            </div>
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
        </div>
      </div>

      {isFiltersOpen ? (
        <OwnProductsFiltersDrawer
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

export default OwnProductsPageContent;
export { OwnProductsPageContent };
