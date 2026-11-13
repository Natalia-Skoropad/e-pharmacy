'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, PackagePlus } from 'lucide-react';

import type {
  OwnedPharmacyListItem,
  OwnedPharmacyOption,
} from '@e-pharmacy/types/pharmacies';

import type { ProductDetails } from '@e-pharmacy/types/products';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { RowsPerPageSelect } from '@e-pharmacy/ui/forms';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { useToast } from '@e-pharmacy/ui/feedback';

import { addOwnerCatalogProduct } from '@/lib/api/browser/owner-all-products.api';
import { getOwnedPharmacies } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import { formatPharmacyLocation } from '@e-pharmacy/utils';
import { getOwnedPharmacyLocationFilterOptions } from '@/lib/pharmacies/owned-pharmacy-location-options';

import {
  buildOwnProductPharmaciesPath,
  parseOwnProductPharmaciesSegments,
  DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
  getProductPharmacyLocationKey,
  type OwnProductPharmaciesRouteState,
} from '@/lib/products/own-product-pharmacies-paths';

import {
  getProductPharmacyRows,
  filterProductPharmacyRows,
  productPharmacyAddedDates,
} from '@/lib/products/own-product-pharmacies-data';

import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { OwnerAddProductConfirmation } from '@/components/all-products/OwnerAddProductConfirmation/OwnerAddProductConfirmation';

import { OwnProductPharmaciesFiltersDrawer } from './OwnProductPharmaciesFiltersDrawer';
import { OwnProductPharmaciesTable } from './OwnProductPharmaciesTable';

import css from './OwnProductPharmaciesTab.module.css';

//===================================================================

/** All pages of the owner registry are read; table pagination never truncates status data. */
async function loadOwnerPharmacies(
  signal: AbortSignal
): Promise<readonly OwnedPharmacyListItem[]> {
  const items: OwnedPharmacyListItem[] = [];

  let page = 1;
  let totalPages = 1;

  do {
    const response = await getOwnedPharmacies(
      { page, perPage: 100 },
      { signal }
    );

    items.push(...response.items);
    totalPages = response.totalPages;
    page += 1;
  } while (!signal.aborted && page <= totalPages);

  return items;
}

//===================================================================

export function OwnProductPharmaciesTab({
  productId,
  product,
  productLoading,
  productError,
  onRetryProduct,
}: Readonly<{
  productId: string;
  product: ProductDetails | null;
  productLoading: boolean;
  productError: string | null;
  onRetryProduct: () => void;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const base = `/pharmacy/products/${productId}/pharmacies`;

  const route = useMemo(() => {
    const segments = pathname.startsWith(`${base}/`)
      ? pathname.slice(base.length + 1).split('/')
      : [];

    return parseOwnProductPharmaciesSegments(segments);
  }, [pathname, base]);

  const [registry, setRegistry] = useState<{
    key: string;
    items: readonly OwnedPharmacyListItem[];
    error: boolean;
  } | null>(null);

  const [retryRegistry, setRetryRegistry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const registryKey = `${productId}:${retryRegistry}`;

  useEffect(() => {
    if (!product || productLoading) return;

    const controller = new AbortController();

    void loadOwnerPharmacies(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted)
          setRegistry({ key: registryKey, items, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setRegistry({ key: registryKey, items: [], error: true });
      });

    return () => controller.abort();
  }, [productId, product, productLoading, registryKey]);

  const registryReady = registry?.key === registryKey && !registry.error;
  const registryError = registry?.key === registryKey && registry.error;

  const loading =
    productLoading ||
    (!productError && Boolean(product) && !registryReady && !registryError);

  const rows = useMemo(
    () =>
      product && registryReady
        ? getProductPharmacyRows(product, registry?.items ?? [])
        : [],
    [product, registry, registryReady]
  );

  const pharmacyOptions = useMemo<OwnedPharmacyOption[]>(
    () =>
      rows.map(({ pharmacy }) => ({
        id: pharmacy.id,
        name: pharmacy.name,
        imageUrl: pharmacy.imageUrl,
        email: pharmacy.email,
        phone: pharmacy.phone,
        location: pharmacy.location,
        status: pharmacy.status,
        reviewState: pharmacy.reviewState,
        membershipRole: pharmacy.membershipRole,
      })),
    [rows]
  );

  const loadSearchOptions = useCallback(
    async (
      query: string,
      signal: AbortSignal
    ): Promise<readonly OwnedPharmacyOption[]> => {
      if (signal.aborted) return [];
      const normalized = query.trim().toLocaleLowerCase();

      if (!normalized) return pharmacyOptions;

      return pharmacyOptions.filter((option) =>
        [
          option.id,
          option.name,
          option.email,
          option.phone,
          formatPharmacyLocation(option.location),
        ]
          .filter(Boolean)
          .some((value) => value?.toLocaleLowerCase().includes(normalized))
      );
    },
    [pharmacyOptions]
  );

  const navigate = (next: Partial<OwnProductPharmaciesRouteState>) => {
    router.push(
      buildOwnProductPharmaciesPath(productId, {
        ...route,
        ...next,
        page: next.page ?? 1,
      }),
      { scroll: false }
    );
  };

  const filteredRows = useMemo(
    () => filterProductPharmacyRows(rows, route),
    [rows, route]
  );

  // Location facets are built from the complete owner registry, not the
  // product-specific offers or the current table pagination.
  const locationOptions = useMemo(() => {
    const registries = registryReady ? (registry?.items ?? []) : [];
    const all = getOwnedPharmacyLocationFilterOptions(registries, '', '');

    const chosenRegion =
      all.regions.find(
        (region) => getProductPharmacyLocationKey(region) === route.region
      ) ?? '';

    return getOwnedPharmacyLocationFilterOptions(registries, '', chosenRegion);
  }, [registry, registryReady, route.region]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / route.perPage));

  const visibleRows = filteredRows.slice(
    (route.page - 1) * route.perPage,
    route.page * route.perPage
  );

  useEffect(() => {
    if (registryReady && !productLoading && route.page > pages) {
      router.replace(
        buildOwnProductPharmaciesPath(productId, { ...route, page: pages }),
        { scroll: false }
      );
    }
  }, [registryReady, productLoading, route, pages, productId, router]);

  // All product-specific offers define the calendar; filters must not shrink
  // its bounds or hide dates that exist elsewhere in this product's history.
  const availableDates = productPharmacyAddedDates(rows);

  const activeFilters =
    Number(Boolean(route.pharmacyId)) +
    Number(route.status !== 'all') +
    Number(route.stock !== 'all') +
    Number(Boolean(route.region)) +
    Number(Boolean(route.settlement)) +
    Number(Boolean(route.date.from || route.date.to));

  const existing = new Set(rows.map(({ pharmacy }) => pharmacy.id));

  const eligibleMissing =
    registryReady &&
    product?.status === 'active' &&
    (registry?.items ?? []).some(
      (pharmacy) =>
        pharmacy.membershipRole === 'owner' &&
        (pharmacy.status === 'active' || pharmacy.status === 'on_moderation') &&
        !existing.has(pharmacy.id)
    );

  const confirmAdd = async () => {
    if (!product || !eligibleMissing || isAdding) return;

    setIsAdding(true);

    try {
      await addOwnerCatalogProduct(productId);

      toast.success(
        'The product has been synchronized with eligible pharmacies.'
      );

      setIsAddOpen(false);
      onRetryProduct();
      setRetryRegistry((value) => value + 1);
    } catch (error) {
      const message = getSafeApiErrorMessage(
        error,
        'Could not add the product to eligible pharmacies. Please try again.'
      );

      if (message) toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={css.stack}>
      <section
        className={css.card}
        aria-label="Search and filter product pharmacies"
      >
        <div className={css.searchGrid}>
          <OwnedPharmacySearch
            id="own-product-pharmacy-search"
            label="Pharmacy search"
            value={route.pharmacyId}
            loadOptions={loadSearchOptions}
            isOptionsLoading={Boolean(loading)}
            disabled={Boolean(productError || registryError)}
            onChange={(pharmacyId) => navigate({ pharmacyId })}
          />

          <div className={css.searchAction}>
            <FiltersButton
              className={css.filterButton}
              activeCount={activeFilters}
              controlsId="own-product-pharmacies-filters-panel"
              isExpanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section
        className={css.card}
        aria-label="Pharmacies carrying this product"
      >
        <div className={css.tableStack}>
          {eligibleMissing ? (
            <div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsAddOpen(true)}
              >
                <PackagePlus size={17} aria-hidden="true" /> Add to eligible
                pharmacies
              </Button>
            </div>
          ) : null}
          <div className={css.tableToolbar}>
            <div className={css.rowsControl}>
              <RowsPerPageSelect
                id="own-product-pharmacies-rows-per-page"
                value={route.perPage}
                onChange={(perPage) => navigate({ perPage })}
              />
            </div>
            {registryReady && !productLoading ? (
              <CountLabel
                className={css.countLabel}
                fullWidthOnMobile
                shown={visibleRows.length}
                total={filteredRows.length}
                label="pharmacies"
              />
            ) : null}
          </div>

          {registryError || productError ? (
            <ProfileResourceState
              variant="error"
              title="Product pharmacies could not be loaded"
              description="Please try loading the pharmacies again."
              retryLabel="Try again"
              onRetry={() => {
                onRetryProduct();
                setRetryRegistry((value) => value + 1);
              }}
            />
          ) : registryReady && rows.length === 0 ? (
            <ProfileResourceState
              variant="empty"
              icon={<Building2 size={28} aria-hidden="true" />}
              title="Product not added to your pharmacies yet"
              description="When this product is added to an eligible pharmacy, its price and inventory will appear here."
            />
          ) : (
            <OwnProductPharmaciesTable
              rows={loading ? [] : visibleRows}
              loading={Boolean(loading || !product)}
              hasFilters={activeFilters > 0}
            />
          )}
          {registryReady && !productLoading ? (
            <PaginationView
              currentPage={route.page}
              totalPages={pages}
              onPageChange={(page) => navigate({ page })}
            />
          ) : null}
        </div>
      </section>

      {filtersOpen ? (
        <OwnProductPharmaciesFiltersDrawer
          state={route}
          dates={availableDates}
          locationOptions={locationOptions}
          locationsLoading={!registryReady && !registryError}
          onChange={navigate}
          onReset={() =>
            router.push(
              buildOwnProductPharmaciesPath(
                productId,
                DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE
              ),
              { scroll: false }
            )
          }
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
      <OwnerAddProductConfirmation
        isOpen={isAddOpen}
        productName={product?.name}
        isLoading={isAdding}
        onConfirm={() => void confirmAdd()}
        onCancel={() => {
          if (!isAdding) setIsAddOpen(false);
        }}
      />
    </div>
  );
}
