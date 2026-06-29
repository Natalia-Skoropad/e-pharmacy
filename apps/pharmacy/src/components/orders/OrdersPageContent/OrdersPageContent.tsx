'use client';

import { useMemo, useState } from 'react';

import {
  CountLabel,
  FiltersButton,
  ResetFiltersButton,
  RowsPerPageSelect,
  StatusBanner,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/common';

import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@e-pharmacy/hooks';

import { getPharmacyOrdersPath } from '@/lib/pharmacy/routes';
import { OrdersFiltersDrawer } from '@/components/orders/OrdersFiltersDrawer';
import { OrdersTable, type PharmacyOrderRow } from '@/components/orders/OrdersTable';

import css from './OrdersPageContent.module.css';

//===================================================================

export type OrdersFilterState = Readonly<{
  date: {
    from: string;
    to: string;
  };
  client: string;
  orderNumber: string;
  deliveryMethod: string;
  paymentMethod: string;
  status: string;
}>;

//===================================================================

const EMPTY_ORDERS: PharmacyOrderRow[] = [];

const DEFAULT_FILTERS: OrdersFilterState = {
  date: {
    from: '',
    to: '',
  },
  client: '',
  orderNumber: '',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  status: 'all',
};

//===================================================================

function getActiveFiltersCount(filters: OrdersFilterState): number {
  return [
    filters.date.from || filters.date.to,
    filters.client.trim(),
    filters.orderNumber.trim(),
    filters.deliveryMethod !== 'all',
    filters.paymentMethod !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;
}

function filterOrders(orders: PharmacyOrderRow[], filters: OrdersFilterState) {
  const clientQuery = filters.client.trim().toLowerCase();
  const orderQuery = filters.orderNumber.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesDateFrom = !filters.date.from || order.orderDate >= filters.date.from;
    const matchesDateTo = !filters.date.to || order.orderDate <= filters.date.to;
    const matchesClient = !clientQuery || order.client.toLowerCase().includes(clientQuery);
    const matchesOrderNumber =
      !orderQuery || order.orderNumber.toLowerCase().includes(orderQuery);
    const matchesDelivery =
      filters.deliveryMethod === 'all' || order.deliveryMethod === filters.deliveryMethod;
    const matchesPayment =
      filters.paymentMethod === 'all' || order.paymentMethod === filters.paymentMethod;
    const matchesStatus = filters.status === 'all' || order.status === filters.status;

    return (
      matchesDateFrom &&
      matchesDateTo &&
      matchesClient &&
      matchesOrderNumber &&
      matchesDelivery &&
      matchesPayment &&
      matchesStatus
    );
  });
}

//===================================================================

function OrdersPageContent() {
  const [filters, setFilters] = useState<OrdersFilterState>(DEFAULT_FILTERS);
  const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageValue>(20);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useBodyScrollLock(isFiltersOpen);

  useEscapeToClose({
    isOpen: isFiltersOpen,
    onClose: () => setIsFiltersOpen(false),
  });

  const handleBackdropClick = useBackdropClick({
    onClose: () => setIsFiltersOpen(false),
  });

  const filteredOrders = useMemo(
    () => filterOrders(EMPTY_ORDERS, filters),
    [filters]
  );

  const visibleOrders = useMemo(
    () => filteredOrders.slice(0, rowsPerPage),
    [filteredOrders, rowsPerPage]
  );

  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <main className={css.page} aria-labelledby="orders-page-title">
      <div className={css.headerRow}>
        <div>
          <h1 className={css.title} id="orders-page-title">
            Orders
          </h1>
          <p className={css.description}>
            Orders will contain only real client orders for the current pharmacy.
          </p>
        </div>
      </div>

      <div className={css.card}>
        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Verification is required"
            message="New pharmacies do not receive orders until Admin verifies the pharmacy profile."
          />

          <div className={css.toolbar}>
            <CountLabel shown={visibleOrders.length} total={filteredOrders.length} label="records" />

            <div className={css.toolbarActions}>
              {hasActiveFilters ? (
                <ResetFiltersButton href={getPharmacyOrdersPath()} onClick={resetFilters} />
              ) : null}

              <RowsPerPageSelect
                id="orders-rows-per-page"
                value={rowsPerPage}
                onChange={setRowsPerPage}
              />

              <FiltersButton
                activeCount={activeFiltersCount}
                controlsId="orders-filters-panel"
                isExpanded={isFiltersOpen}
                onClick={() => setIsFiltersOpen(true)}
              />
            </div>
          </div>

          <OrdersTable
            orders={visibleOrders}
            emptyMessage={
              hasActiveFilters
                ? 'No orders found for the selected filters. Adjust filters or reset them.'
                : 'Orders will appear here after the pharmacy is verified and clients place orders.'
            }
          />
        </div>
      </div>

      {isFiltersOpen ? (
        <OrdersFiltersDrawer
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

export default OrdersPageContent;
export { OrdersPageContent };
