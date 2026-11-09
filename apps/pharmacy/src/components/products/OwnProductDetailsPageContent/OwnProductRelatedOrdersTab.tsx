'use client';

import { useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';

import type { OrderStatus } from '@e-pharmacy/types/orders';

import {
  ORDER_STATUS_PRESENTATION,
  ORDER_CREATED_BY_LABELS,
} from '@e-pharmacy/config/presentation';

import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';
import type { RowsPerPageValue } from '@e-pharmacy/ui/forms';

import {
  DateFilter,
  RowsPerPageSelect,
  SearchInput,
  SelectField,
} from '@e-pharmacy/ui/forms';

import {
  FiltersButton,
  LoadingSpinner,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';

import {
  CountLabel,
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  formatInitials,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PaginationView } from '@e-pharmacy/ui/navigation';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';

import { getPharmacyOrders } from '@/lib/api/browser';
import { getPharmacyClientPath } from '@/lib/routes';
import { getProductImageSrc } from '@/lib/products/product-images';
import type { PharmacyOrderRow } from '@/lib/orders/orders';
import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

import { OrderStatistics } from '@/components/statistics';

import {
  DEFAULT_RELATED_ORDERS_FILTERS,
  PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ORDER_CREATED_BY_OPTIONS,
  getRelatedOrderRows,
  type RelatedOrdersFilters,
  type RelatedOrderRow,
  type ResourceStatus,
} from './own-product-detail-helpers';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

export function OwnProductRelatedOrdersTab({
  productId,
}: Readonly<{ productId: string }>) {
  const [relatedOrders, setRelatedOrders] = useState<PharmacyOrderRow[]>([]);
  const [relatedOrdersTotal, setRelatedOrdersTotal] = useState(0);
  const [relatedOrdersTotalPages, setRelatedOrdersTotalPages] = useState(1);

  const [relatedOrdersStatus, setRelatedOrdersStatus] =
    useState<ResourceStatus>('idle');

  const [relatedOrderStatistics, setRelatedOrderStatistics] =
    useState<OrderStatisticsCounts>(DEFAULT_ORDER_STATISTICS);

  const [relatedOrdersEarliestCreatedAt, setRelatedOrdersEarliestCreatedAt] =
    useState<string | null>(null);

  const [relatedOrderNumberSearch, setRelatedOrderNumberSearch] = useState('');
  const [relatedClientSearch, setRelatedClientSearch] = useState('');

  const [relatedRowsPerPage, setRelatedRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);

  const [relatedFilters, setRelatedFilters] = useState<RelatedOrdersFilters>(
    DEFAULT_RELATED_ORDERS_FILTERS
  );

  const [isRelatedFiltersOpen, setIsRelatedFiltersOpen] = useState(false);

  const debouncedRelatedOrderNumberSearch = useDebouncedValue(
    relatedOrderNumberSearch,
    450
  );

  const debouncedRelatedClientSearch = useDebouncedValue(
    relatedClientSearch,
    450
  );

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) setRelatedOrdersStatus('loading');
    });

    void getPharmacyOrders(
      {
        page: relatedCurrentPage,
        perPage: relatedRowsPerPage,
        productId,
        scope: 'owner' as const,
        orderNumber: debouncedRelatedOrderNumberSearch.trim() || undefined,
        client: debouncedRelatedClientSearch.trim() || undefined,

        status:
          relatedFilters.orderStatus === 'all'
            ? undefined
            : relatedFilters.orderStatus,

        createdByType:
          relatedFilters.createdByType === 'all'
            ? undefined
            : relatedFilters.createdByType,

        dateFrom: relatedFilters.date.from || undefined,
        dateTo: relatedFilters.date.to || undefined,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        const pages = Math.max(1, response.totalPages);

        if (relatedCurrentPage > pages) {
          setRelatedCurrentPage(pages);
          return;
        }

        setRelatedOrders([...response.items]);
        setRelatedOrdersTotal(response.total);
        setRelatedOrdersTotalPages(pages);
        setRelatedOrderStatistics(response.statistics);
        setRelatedOrdersEarliestCreatedAt(response.earliestCreatedAt);
        setRelatedOrdersStatus('success');
      })
      .catch(() => {
        if (!controller.signal.aborted) setRelatedOrdersStatus('error');
      });

    return () => controller.abort();
  }, [
    productId,
    relatedCurrentPage,
    relatedRowsPerPage,
    relatedFilters,
    debouncedRelatedOrderNumberSearch,
    debouncedRelatedClientSearch,
  ]);

  const relatedOrderRows = getRelatedOrderRows(productId, relatedOrders);

  const handleRelatedStatisticsClick = (status: OrderStatus) => {
    setRelatedFilters((currentFilters) => ({
      ...currentFilters,
      orderStatus: currentFilters.orderStatus === status ? 'all' : status,
    }));

    setRelatedCurrentPage(1);
  };

  const relatedActiveFiltersCount = countTrueConditions(
    Boolean(relatedFilters.date.from || relatedFilters.date.to),
    relatedFilters.orderStatus !== 'all',
    relatedFilters.createdByType !== 'all',
    Boolean(relatedOrderNumberSearch.trim()),
    Boolean(relatedClientSearch.trim())
  );

  const relatedOrderColumns = useMemo<Array<DataTableColumn<RelatedOrderRow>>>(
    () => [
      {
        key: 'orderDate',
        title: <TableHeaderTitle parts={['Order', 'date']} />,

        render: (row: RelatedOrderRow) => (
          <TableDateTime value={row.orderDateValue} />
        ),
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,

        // Owner-wide orders are not tied to the currently selected pharmacy.
        // Do not open a different pharmacy's operational order details.
        render: (row: RelatedOrderRow) => row.orderNumber,
      },
      {
        key: 'clientPhoto',
        title: <TableHeaderTitle parts={['Client', 'photo']} />,

        render: (row: RelatedOrderRow) => (
          <TableImagePreview
            src={
              getProductImageSrc(row.clientPhotoUrl ?? undefined) ?? undefined
            }
            alt={`${row.client} photo`}
            fallback={formatInitials(row.client)}
          />
        ),
      },
      {
        key: 'client',
        title: <TableHeaderTitle parts={['Client', 'name']} />,

        render: (row: RelatedOrderRow) =>
          row.clientId ? (
            <TextActionButton href={getPharmacyClientPath(row.clientId)}>
              {row.client}
            </TextActionButton>
          ) : (
            row.client
          ),
      },
      {
        key: 'quantity',
        title: <TableHeaderTitle parts={['Order', 'quantity']} />,
        render: (row: RelatedOrderRow) => row.quantity,
      },
      {
        key: 'fixedUnitPrice',
        title: <TableHeaderTitle parts={['Fixed unit ', 'price, ₴']} />,
        render: (row: RelatedOrderRow) => row.fixedUnitPrice,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Order ', 'amount, ₴']} />,
        render: (row: RelatedOrderRow) => row.amount,
      },
      {
        key: 'createdByType',
        title: <TableHeaderTitle parts={['Created', 'by']} />,

        render: (row: RelatedOrderRow) =>
          ORDER_CREATED_BY_LABELS[row.createdByType],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,

        render: (row: RelatedOrderRow) => (
          <StatusBadge {...ORDER_STATUS_PRESENTATION[row.status]} />
        ),
      },
    ],
    []
  );

  return (
    <>
      {
        <>
          {relatedOrdersStatus === 'error' ? (
            <StatusBanner
              tone="danger"
              title="Related orders are temporarily unavailable"
              message="Could not load orders for this product. Please try again later."
            />
          ) : relatedOrdersStatus !== 'success' ? (
            <LoadingSpinner label="Loading related orders..." />
          ) : (
            <div className={css.sectionStack}>
              <section
                className={css.sectionCard}
                aria-labelledby="related-orders-title"
              >
                <h3 className={css.panelTitle} id="related-orders-title">
                  Related orders
                </h3>

                <OrderStatistics
                  counts={relatedOrderStatistics}
                  className={css.relatedStatistics}
                  onStatusClick={handleRelatedStatisticsClick}
                />
              </section>

              <section
                className={css.sectionCard}
                aria-label="Related orders filters"
              >
                <div className={css.searchGrid}>
                  <SearchInput
                    id="related-orders-order-number-search"
                    label="Order number search"
                    value={relatedOrderNumberSearch}
                    placeholder="Order number"
                    isActive={Boolean(relatedOrderNumberSearch)}
                    onChange={(value) => {
                      setRelatedOrderNumberSearch(value);
                      setRelatedCurrentPage(1);
                    }}
                  />

                  <SearchInput
                    id="related-orders-client-search"
                    label="Client search"
                    labelAccessory={
                      <InfoTooltip
                        label="How can I search for a client?"
                        title="Client search"
                        icon={<UsersRound size={20} aria-hidden="true" />}
                        items={[
                          {
                            title: 'Search fields',
                            description:
                              'Search by client name, ID, email, phone number, or address.',
                          },
                        ]}
                        escapeOverflow
                      />
                    }
                    value={relatedClientSearch}
                    placeholder="Client"
                    isActive={Boolean(relatedClientSearch)}
                    onChange={(value) => {
                      setRelatedClientSearch(value);
                      setRelatedCurrentPage(1);
                    }}
                  />

                  <div className={css.searchAction}>
                    <FiltersButton
                      activeCount={relatedActiveFiltersCount}
                      controlsId="related-orders-filters-panel"
                      isExpanded={isRelatedFiltersOpen}
                      className={css.filterButton}
                      onClick={() => setIsRelatedFiltersOpen(true)}
                    />
                  </div>
                </div>
              </section>

              <section
                className={css.sectionCard}
                aria-label="Related orders table"
              >
                <div className={css.tableStack}>
                  <div className={css.tableToolbar}>
                    <div className={css.rowsControl}>
                      <RowsPerPageSelect
                        id="related-orders-rows-per-page"
                        value={relatedRowsPerPage}
                        options={PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS}
                        onChange={(value) => {
                          setRelatedRowsPerPage(value);
                          setRelatedCurrentPage(1);
                        }}
                      />
                    </div>

                    <CountLabel
                      className={css.countLabel}
                      shown={relatedOrderRows.length}
                      total={relatedOrdersTotal}
                      label="orders"
                    />
                  </div>

                  <DataTable
                    columns={relatedOrderColumns}
                    items={relatedOrderRows}
                    getItemKey={(row) => row.id}
                    minWidth={0}
                    labels={{
                      empty:
                        relatedActiveFiltersCount > 0 ||
                        relatedOrderNumberSearch.trim() ||
                        relatedClientSearch.trim()
                          ? 'No related orders found for the selected search or filters.'
                          : 'There are no orders with this product yet.',
                    }}
                  />

                  <PaginationView
                    currentPage={relatedCurrentPage}
                    totalPages={relatedOrdersTotalPages}
                    onPageChange={setRelatedCurrentPage}
                  />
                </div>
              </section>
            </div>
          )}
        </>
      }
      {isRelatedFiltersOpen ? (
        <FilterDrawer
          id="related-orders-filters-panel"
          eyebrow="Product details"
          title="Related orders filters"
          hasActiveFilters={relatedActiveFiltersCount > 0}
          resetHref="#"
          onReset={() => {
            setRelatedFilters(DEFAULT_RELATED_ORDERS_FILTERS);
            setRelatedOrderNumberSearch('');
            setRelatedClientSearch('');
            setRelatedCurrentPage(1);
          }}
          onClose={() => setIsRelatedFiltersOpen(false)}
        >
          <DateFilter
            id="related-orders-date-filter"
            minDate={relatedOrdersEarliestCreatedAt ?? undefined}
            disabled={!relatedOrdersEarliestCreatedAt}
            label="Order date"
            value={relatedFilters.date}
            isActive={Boolean(
              relatedFilters.date.from || relatedFilters.date.to
            )}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(date) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                date,
              }));

              setRelatedCurrentPage(1);
            }}
          />

          <SelectField
            id="related-order-status-filter"
            label="Order status"
            value={relatedFilters.orderStatus}
            options={ORDER_STATUS_OPTIONS}
            onChange={(orderStatus) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                orderStatus,
              }));

              setRelatedCurrentPage(1);
            }}
          />

          <SelectField
            id="related-order-created-by-filter"
            label="Created by"
            value={relatedFilters.createdByType}
            options={ORDER_CREATED_BY_OPTIONS}
            onChange={(createdByType) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                createdByType,
              }));

              setRelatedCurrentPage(1);
            }}
          />
        </FilterDrawer>
      ) : null}
    </>
  );
}
