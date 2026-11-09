'use client';
import { useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';

import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  ProductStockMovement,
  ProductOffer,
  ProductDetails,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import type { RowsPerPageValue } from '@e-pharmacy/ui/forms';

import {
  DateFilter,
  RowsPerPageSelect,
  SearchInput,
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

import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { countTrueConditions } from '@e-pharmacy/utils/collections';

import { getProductStockMovements } from '@/lib/api/browser';
import { getPharmacyOrderPath } from '@/lib/routes';

import { OwnProductStatistics } from '@/components/statistics/OwnProductStatistics/OwnProductStatistics';
import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';

import {
  DEFAULT_STOCK_MOVEMENT_FILTERS,
  PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  STOCK_EVENT_TYPE_OPTIONS,
  STOCK_SOURCE_OPTIONS,
  getStockMovementRows,
  paginateRows,
  getTotalPages,
  type StockMovementFilters,
  type StockMovementRow,
  type ResourceStatus,
} from './own-product-detail-helpers';

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
  pharmacyId: string;
  onPharmacyChange: (pharmacyId: string) => void;
  productLoading: boolean;
  productError: string | null;
  onRetryProduct: () => void;
}>;

//===================================================================

export function OwnProductStockMovementTab({
  productId,
  product,
  pharmacyId,
  onPharmacyChange,
  productLoading,
  productError,
  onRetryProduct,
}: OwnProductStockMovementTabProps) {
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

  const [stockOrderNumberSearch, setStockOrderNumberSearch] = useState('');
  const [stockCommentSearch, setStockCommentSearch] = useState('');

  const [stockRowsPerPage, setStockRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [stockCurrentPage, setStockCurrentPage] = useState(1);

  const [stockFilters, setStockFilters] = useState<StockMovementFilters>(
    DEFAULT_STOCK_MOVEMENT_FILTERS
  );

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
        setStockStatus('success');
        setLastLoadedKey(stockKey);
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setStockMovements([]);
        setStockEarliestCreatedAt(null);
        setStockStatus('error');
        setLastLoadedKey(stockKey);
      });

    return () => controller.abort();
  }, [productId, pharmacyId, currentOffer, stockKey]);

  const currentStockStatus =
    lastLoadedKey === stockKey ? stockStatus : 'loading';

  const stockMovementRows = getStockMovementRows(
    stockMovements,
    stockFilters,
    stockOrderNumberSearch,
    stockCommentSearch
  );

  const paginatedStockMovementRows = paginateRows(
    stockMovementRows,
    stockCurrentPage,
    stockRowsPerPage
  );

  const stockMovementTotalPages = getTotalPages(
    stockMovementRows.length,
    stockRowsPerPage
  );

  const stockActiveFiltersCount = countTrueConditions(
    Boolean(stockFilters.date.from || stockFilters.date.to),
    stockFilters.eventType !== 'all',
    stockFilters.source !== 'all',
    stockFilters.orderStatus !== 'all',
    Boolean(stockOrderNumberSearch.trim()),
    Boolean(stockCommentSearch.trim())
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

  return (
    <div className={css.sectionStack}>
      <div className={css.pharmacySelector}>
        <OwnedPharmacySearch
          id="own-product-stock-movement-pharmacy-search"
          label="Select pharmacy"
          value={pharmacyId}
          onChange={(value) => {
            onPharmacyChange(value);
            setStockCurrentPage(1);
          }}
          explainStatistics
        />
      </div>

      {!pharmacyId ? (
        <ProfileResourceState
          variant="empty"
          icon={<History size={28} aria-hidden="true" />}
          title="Select a pharmacy to view stock movement"
          description="Choose a specific pharmacy to review this product's stock levels and stock movement history."
        />
      ) : productLoading ? (
        <StatsLoadingSkeleton
          count={4}
          columns={4}
          tabletColumns={2}
          label="Loading pharmacy stock statistics"
        />
      ) : productError || !product ? (
        <ProfileResourceState
          variant="error"
          title="Product details could not be loaded"
          description={productError ?? 'Try loading the product again.'}
          retryLabel="Try again"
          onRetry={onRetryProduct}
        />
      ) : !currentOffer ? (
        <ProfileResourceState
          variant="empty"
          icon={<History size={28} aria-hidden="true" />}
          title="This product is not available in the selected pharmacy"
          description="Select another pharmacy to review its stock and stock movement history for this product."
        />
      ) : (
        <div className={css.sectionStack}>
          <OwnProductStatistics counts={getPharmacyStockCounts(currentOffer)} />
          {currentStockStatus === 'error' ? (
            <ProfileResourceState
              variant="error"
              title="Stock movement could not be loaded"
              description="Stock movement history is temporarily unavailable."
              retryLabel="Retry stock movement"
              onRetry={() => setStockRetry((value) => value + 1)}
            />
          ) : currentStockStatus !== 'success' ? (
            <ProfileResourceState
              variant="loading"
              title="Loading stock movement"
              description="The selected pharmacy's product stock history is being loaded."
            />
          ) : (
            <div className={css.sectionStack}>
              <section
                className={css.sectionCard}
                aria-labelledby="stock-movement-title"
              >
                <h3
                  className={`${css.panelTitle} ${css.panelTitleWithHelp}`}
                  id="stock-movement-title"
                >
                  Stock movement
                  <InfoTooltip
                    label="How does the stock movement table work?"
                    title="How stock movement works"
                    icon={<History size={20} strokeWidth={2} />}
                    escapeOverflow
                    items={[
                      {
                        title: 'Stock arrivals',
                        description:
                          'Increase both physical and available quantity.',
                      },
                      {
                        title: 'Order reservations',
                        description:
                          'New and In progress orders reserve available units.',
                      },
                      {
                        title: 'Final order status',

                        description:
                          'Rejected orders release their reserve, while Successful orders write reserved units off physical stock.',
                      },
                    ]}
                  />
                </h3>

                <div className={css.searchGrid}>
                  <SearchInput
                    id="stock-movement-order-number-search"
                    label="Order number search"
                    value={stockOrderNumberSearch}
                    placeholder="Order number"
                    isActive={Boolean(stockOrderNumberSearch)}
                    onChange={(value) => {
                      setStockOrderNumberSearch(value);
                      setStockCurrentPage(1);
                    }}
                  />

                  <SearchInput
                    id="stock-movement-comment-search"
                    label="Comment search"
                    value={stockCommentSearch}
                    placeholder="Comment"
                    isActive={Boolean(stockCommentSearch)}
                    onChange={(value) => {
                      setStockCommentSearch(value);
                      setStockCurrentPage(1);
                    }}
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
                <div className={css.tableStack}>
                  <div className={css.tableToolbar}>
                    <div className={css.rowsControl}>
                      <RowsPerPageSelect
                        id="stock-movement-rows-per-page"
                        value={stockRowsPerPage}
                        options={PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS}
                        onChange={(value) => {
                          setStockRowsPerPage(value);
                          setStockCurrentPage(1);
                        }}
                      />
                    </div>

                    <CountLabel
                      className={css.countLabel}
                      shown={paginatedStockMovementRows.length}
                      total={stockMovementRows.length}
                      label="records"
                    />
                  </div>

                  <DataTable
                    columns={stockMovementColumns}
                    items={paginatedStockMovementRows}
                    getItemKey={(row) => row.id}
                    minWidth={0}
                    labels={{
                      empty: 'Stock movement history is empty.',
                    }}
                  />

                  <PaginationView
                    currentPage={stockCurrentPage}
                    totalPages={stockMovementTotalPages}
                    onPageChange={setStockCurrentPage}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      )}
      {isStockFiltersOpen && pharmacyId && currentOffer ? (
        <FilterDrawer
          id="stock-movement-filters-panel"
          eyebrow="Product details"
          title="Stock movement filters"
          hasActiveFilters={stockActiveFiltersCount > 0}
          resetHref="#"
          onReset={() => {
            setStockFilters(DEFAULT_STOCK_MOVEMENT_FILTERS);
            setStockOrderNumberSearch('');
            setStockCommentSearch('');
            setStockCurrentPage(1);
          }}
          onClose={() => setIsStockFiltersOpen(false)}
        >
          <DateFilter
            id="stock-movement-date-filter"
            minDate={stockEarliestCreatedAt ?? undefined}
            disabled={!stockEarliestCreatedAt}
            label="Last changed date"
            value={stockFilters.date}
            isActive={Boolean(stockFilters.date.from || stockFilters.date.to)}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(date) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                date,
              }));

              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-event-type-filter"
            label="Event type"
            value={stockFilters.eventType}
            options={STOCK_EVENT_TYPE_OPTIONS}
            onChange={(eventType) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                eventType,
              }));

              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-source-filter"
            label="Source"
            value={stockFilters.source}
            options={STOCK_SOURCE_OPTIONS}
            onChange={(source) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                source,
              }));

              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-order-status-filter"
            label="Order status"
            value={stockFilters.orderStatus}
            options={ORDER_STATUS_OPTIONS}
            onChange={(orderStatus) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                orderStatus,
              }));

              setStockCurrentPage(1);
            }}
          />
        </FilterDrawer>
      ) : null}
    </div>
  );
}
