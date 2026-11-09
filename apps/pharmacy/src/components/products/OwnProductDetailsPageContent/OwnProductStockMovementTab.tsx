'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { History } from 'lucide-react';

import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  ProductStockMovement,
  ProductOffer,
  ProductDetails,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import {
  DateFilter,
  RowsPerPageSelect,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { FiltersButton, TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge, StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  CountLabel,
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { countTrueConditions } from '@e-pharmacy/utils/collections';

import {
  buildStockMovementPath,
  parseStockMovementSegments,
  DEFAULT_STOCK_MOVEMENT_ROUTE,
} from '@/lib/products/stock-movement-paths';

import { getProductStockMovements } from '@/lib/api/browser';
import { getPharmacyOrderPath } from '@/lib/routes';

import { OwnProductStatistics } from '@/components/statistics/OwnProductStatistics/OwnProductStatistics';
import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';

import {
  DEFAULT_STOCK_MOVEMENT_FILTERS,
  PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS,
  getStockMovementRows,
  paginateRows,
  getTotalPages,
  type StockMovementRow,
  type ResourceStatus,
} from './own-product-detail-helpers';

import { StockMovementOrderSearch } from './StockMovementOrderSearch';

import {
  STOCK_EVENT_FILTER_OPTIONS,
  STOCK_SOURCE_FILTER_OPTIONS,
  STOCK_ORDER_STATUS_FILTER_OPTIONS,
} from './StockMovementFilterOptions';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

function getPharmacyStockCounts(
  offer: ProductOffer
): OwnProductStatisticsCounts {
  const inStock = offer.totalQuantity ?? 0;
  const reserved = offer.reservedQuantity ?? 0;
  const available = offer.availableQuantity;

  return {
    inStock: { quantity: inStock, amount: inStock * offer.price },
    reserved: { quantity: reserved, amount: reserved * offer.price },
    available: { quantity: available, amount: available * offer.price },
    outOfStock: { quantity: offer.inStock ? 0 : 1 },
  };
}

//===================================================================

type OwnProductStockMovementTabProps = Readonly<{
  productId: string;
  product: ProductDetails | null;
  productLoading: boolean;
  productError: string | null;
  onRetryProduct: () => void;
}>;

//===================================================================

export function OwnProductStockMovementTab({
  productId,
  product,
  productLoading,
  productError,
  onRetryProduct,
}: OwnProductStockMovementTabProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/pharmacy/products/${productId}/stock-movement`;

  const segments = pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length + 1).split('/')
    : [];

  const route = parseStockMovementSegments(segments);
  const pharmacyId = route.pharmacyId;

  const changeRoute = (next: Partial<typeof route>) => {
    router.push(
      buildStockMovementPath(productId, {
        ...route,
        ...next,
        page: next.page ?? 1,
      }),
      { scroll: false }
    );
  };

  const currentOffer = pharmacyId
    ? (product?.offers.find(
        (offer) => String(offer.pharmacyId) === pharmacyId
      ) ?? null)
    : null;

  const [stockMovements, setStockMovements] = useState<ProductStockMovement[]>(
    []
  );

  const [stockStatus, setStockStatus] = useState<ResourceStatus>('idle');
  const [lastLoadedKey, setLastLoadedKey] = useState<string | null>(null);
  const [stockRetry, setStockRetry] = useState(0);
  const stockKey = `${productId}:${pharmacyId}:${stockRetry}`;

  const [stockEarliestCreatedAt, setStockEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [stockLatestCreatedAt, setStockLatestCreatedAt] = useState<
    string | null
  >(null);

  const [isStockFiltersOpen, setIsStockFiltersOpen] = useState(false);

  useEffect(() => {
    // No stock query until a pharmacy is explicitly selected and the product
    // is known to be in that pharmacy. The backend verifies the membership.
    if (!pharmacyId || !currentOffer) return;

    const controller = new AbortController();

    void getProductStockMovements(
      productId,
      { signal: controller.signal },
      pharmacyId
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setStockMovements([...response.items]);
        setStockEarliestCreatedAt(response.earliestCreatedAt);

        setStockLatestCreatedAt(
          response.items.reduce<string | null>((latest, movement) => {
            const date = movement.occurredAt.slice(0, 10);

            if (!latest || date > latest) return date;

            return latest;
          }, null)
        );

        setStockStatus('success');
        setLastLoadedKey(stockKey);
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setStockMovements([]);
        setStockEarliestCreatedAt(null);
        setStockLatestCreatedAt(null);
        setStockStatus('error');
        setLastLoadedKey(stockKey);
      });

    return () => controller.abort();
  }, [productId, pharmacyId, currentOffer, stockKey]);

  const currentStockStatus =
    lastLoadedKey === stockKey ? stockStatus : 'loading';

  // Search options come from all stock movements for this product/pharmacy,
  // not from the complete orders registry or the currently filtered page.
  const allStockRows = getStockMovementRows(
    stockMovements,
    DEFAULT_STOCK_MOVEMENT_FILTERS
  );

  const stockMovementRows = getStockMovementRows(stockMovements, {
    date: route.date,
    eventType: route.eventType,
    source: route.source,
    orderStatus: route.orderStatus,
  }).filter((row) => !route.orderId || row.orderId === route.orderId);

  const paginatedStockMovementRows = paginateRows(
    stockMovementRows,
    route.page,
    route.perPage
  );

  const stockMovementTotalPages = getTotalPages(
    stockMovementRows.length,
    route.perPage
  );

  const stockActiveFiltersCount = countTrueConditions(
    Boolean(route.date.from || route.date.to),
    route.eventType !== 'all',
    route.source !== 'all',
    route.orderStatus !== 'all',
    Boolean(route.orderId)
  );

  const stockMovementColumns = useMemo<
    Array<DataTableColumn<StockMovementRow>>
  >(
    () => [
      {
        key: 'date',
        title: <TableHeaderTitle parts={['Last', 'changed']} />,

        render: (row: StockMovementRow) => (
          <TableDateTime value={row.dateValue} />
        ),
      },
      {
        key: 'eventType',
        title: <TableHeaderTitle parts={['Event', 'type']} />,

        render: (row: StockMovementRow) => (
          <strong
            className={
              row.eventTypeValue === 'reserve'
                ? css.valueReserve
                : row.eventTypeValue === 'release'
                  ? css.valueRelease
                  : row.quantityValue < 0
                    ? css.valueOut
                    : css.valueIn
            }
          >
            {row.eventType}
          </strong>
        ),
      },
      {
        key: 'quantity',
        title: 'Quantity',

        render: (row: StockMovementRow) => (
          <strong
            className={
              row.eventTypeValue === 'reserve'
                ? css.valueReserve
                : row.eventTypeValue === 'release'
                  ? css.valueRelease
                  : row.quantityValue < 0
                    ? css.valueOut
                    : css.valueIn
            }
          >
            {row.quantity}
          </strong>
        ),
      },
      {
        key: 'price',
        title: <TableHeaderTitle parts={['Price, ₴']} />,
        render: (row: StockMovementRow) => row.price,
      },
      {
        key: 'totalAmount',
        title: <TableHeaderTitle parts={['Total', ' amount, ₴']} />,
        render: (row: StockMovementRow) => row.totalAmount,
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,

        render: (row: StockMovementRow) =>
          row.orderId ? (
            <TextActionButton href={getPharmacyOrderPath(row.orderId)}>
              {row.orderNumber}
            </TextActionButton>
          ) : (
            '—'
          ),
      },
      {
        key: 'orderStatus',
        title: <TableHeaderTitle parts={['Order', 'status']} />,

        render: (row: StockMovementRow) =>
          row.orderStatus ? (
            <StatusBadge {...ORDER_STATUS_PRESENTATION[row.orderStatus]} />
          ) : (
            '—'
          ),
      },
      {
        key: 'source',
        title: 'Source',
        render: (row: StockMovementRow) => row.source,
      },
      {
        key: 'comment',
        title: 'Comment',
        render: (row: StockMovementRow) => row.comment,
      },
    ],
    []
  );

  const hasSelectedPharmacy = Boolean(pharmacyId);

  const stockReadLoading =
    currentStockStatus !== 'success' && currentStockStatus !== 'error';

  return (
    <div className={css.sectionStack}>
      <div className={css.pharmacySelector}>
        <OwnedPharmacySearch
          id="own-product-stock-movement-pharmacy-search"
          label="Select pharmacy"
          value={pharmacyId}
          onChange={(value) =>
            router.push(
              buildStockMovementPath(productId, {
                ...DEFAULT_STOCK_MOVEMENT_ROUTE,
                pharmacyId: value,
              }),

              { scroll: false }
            )
          }
          explainStatistics
        />
      </div>

      {!hasSelectedPharmacy ? (
        <ProfileResourceState
          variant="empty"
          icon={<History size={28} aria-hidden="true" />}
          title="Select a pharmacy to view stock movement"
          description="Choose a specific pharmacy to review this product's stock levels and stock movement history."
        />
      ) : (
        <>
          <section
            className={css.stockStatisticsCard}
            aria-label="Product stock statistics"
          >
            {productLoading ? (
              <StatsLoadingSkeleton
                count={3}
                columns={3}
                tabletColumns={2}
                label="Loading product stock statistics"
              />
            ) : productError || !product ? (
              <ProfileResourceState
                variant="error"
                title="Product stock statistics could not be loaded"
                description={productError ?? 'Try loading the product again.'}
                retryLabel="Try again"
                onRetry={onRetryProduct}
              />
            ) : !currentOffer ? (
              <ProfileResourceState
                variant="empty"
                icon={<History size={28} />}
                title="Product not added to this pharmacy"
                description="Select a pharmacy where this product is available to view stock and movement history."
              />
            ) : (
              <OwnProductStatistics
                counts={getPharmacyStockCounts(currentOffer)}
                visibleKeys={['inStock', 'reserved', 'available']}
              />
            )}
          </section>

          {productLoading || (!productError && product && currentOffer) ? (
            <>
              <section
                className={css.sectionCard}
                aria-label="Stock movement filters"
              >
                <div className={css.stockSearchGrid}>
                  <StockMovementOrderSearch
                    rows={
                      lastLoadedKey === stockKey &&
                      currentStockStatus === 'success'
                        ? allStockRows
                        : []
                    }
                    orderId={route.orderId}
                    onChange={(orderId) => changeRoute({ orderId })}
                    isLoading={stockReadLoading}
                    isError={currentStockStatus === 'error'}
                  />
                  <div className={css.searchAction}>
                    <FiltersButton
                      activeCount={stockActiveFiltersCount}
                      controlsId="stock-movement-filters-panel"
                      isExpanded={isStockFiltersOpen}
                      className={css.filterButton}
                      onClick={() => setIsStockFiltersOpen(true)}
                    />
                  </div>
                </div>
              </section>

              <section
                className={css.sectionCard}
                aria-label="Stock movement table"
              >
                {currentStockStatus === 'error' ? (
                  <ProfileResourceState
                    variant="error"
                    title="Stock movement could not be loaded"
                    description="Stock movement history is temporarily unavailable."
                    retryLabel="Retry stock movement"
                    onRetry={() => setStockRetry((value) => value + 1)}
                  />
                ) : (
                  <div className={css.tableStack}>
                    <div className={css.tableToolbar}>
                      <div className={css.rowsControl}>
                        <RowsPerPageSelect
                          id="stock-movement-rows-per-page"
                          value={route.perPage}
                          options={PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS}
                          onChange={(perPage) =>
                            changeRoute({
                              perPage: perPage as typeof route.perPage,
                            })
                          }
                        />
                      </div>
                      {!stockReadLoading ? (
                        <CountLabel
                          className={css.countLabel}
                          fullWidthOnMobile
                          shown={paginatedStockMovementRows.length}
                          total={stockMovementRows.length}
                          label="records"
                        />
                      ) : null}
                    </div>
                    <DataTable
                      columns={stockMovementColumns}
                      items={stockReadLoading ? [] : paginatedStockMovementRows}
                      isLoading={stockReadLoading}
                      getItemKey={(row) => row.id}
                      minWidth={0}
                      labels={{
                        loading: 'Loading stock movement history...',
                        empty: 'Stock movement history is empty.',
                      }}
                    />
                    {!stockReadLoading ? (
                      <PaginationView
                        currentPage={route.page}
                        totalPages={stockMovementTotalPages}
                        onPageChange={(page) => changeRoute({ page })}
                      />
                    ) : null}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </>
      )}

      {isStockFiltersOpen && pharmacyId && currentOffer ? (
        <FilterDrawer
          id="stock-movement-filters-panel"
          eyebrow="Stock movement"
          title="Stock movement filters"
          hasActiveFilters={stockActiveFiltersCount > 0}
          onReset={() => {
            router.push(
              buildStockMovementPath(productId, {
                ...DEFAULT_STOCK_MOVEMENT_ROUTE,
                pharmacyId,
              }),

              { scroll: false }
            );

            setIsStockFiltersOpen(false);
          }}
          onClose={() => setIsStockFiltersOpen(false)}
        >
          <DateFilter
            id="stock-movement-date-filter"
            minDate={stockEarliestCreatedAt ?? undefined}
            maxDate={stockLatestCreatedAt ?? undefined}
            disabled={!stockEarliestCreatedAt || !stockLatestCreatedAt}
            label="Last changed date"
            value={route.date}
            isActive={Boolean(route.date.from || route.date.to)}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(date) => changeRoute({ date })}
          />

          <SelectField
            id="stock-event-type-filter"
            label="Event type"
            value={route.eventType}
            options={STOCK_EVENT_FILTER_OPTIONS}
            isActive={route.eventType !== 'all'}
            onChange={(eventType) => changeRoute({ eventType })}
          />

          <SelectField
            id="stock-source-filter"
            label="Source"
            value={route.source}
            options={STOCK_SOURCE_FILTER_OPTIONS}
            isActive={route.source !== 'all'}
            onChange={(source) => changeRoute({ source })}
          />

          <SelectField
            id="stock-order-status-filter"
            label="Order status"
            value={route.orderStatus}
            options={STOCK_ORDER_STATUS_FILTER_OPTIONS}
            isActive={route.orderStatus !== 'all'}
            onChange={(orderStatus) => changeRoute({ orderStatus })}
          />
        </FilterDrawer>
      ) : null}
    </div>
  );
}
