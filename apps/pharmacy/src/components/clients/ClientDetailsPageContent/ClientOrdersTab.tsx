import type { Dispatch, SetStateAction } from 'react';

import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { CountLabel, DataTable } from '@e-pharmacy/ui/data-display';

import {
  SearchInput,
  RowsPerPageSelect,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';

import type { PharmacyOrderRow } from '@/lib/orders/orders';

import { PRODUCT_ROWS_PER_PAGE_OPTIONS } from './ClientDetailFilters';
import { ORDER_COLUMNS } from './ClientDetailTableColumns';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type OrderTabProps = Readonly<{
  orderNumberSearch: string;
  setOrderNumberSearch: (value: string) => void;
  orderCommentSearch: string;
  setOrderCommentSearch: (value: string) => void;
  orderFiltersCount: number;
  isOrdersFiltersOpen: boolean;
  setIsOrdersFiltersOpen: (value: boolean) => void;
  ordersRowsPerPage: RowsPerPageValue;
  setOrdersRowsPerPage: (value: RowsPerPageValue) => void;
  orderSearchKey: string;

  setOrdersPageState: Dispatch<
    SetStateAction<{ searchKey: string; page: number }>
  >;

  ordersStatus: 'idle' | 'loading' | 'success' | 'error';
  orders: readonly PharmacyOrderRow[];
  ordersTotal: number;
  ordersError: string;
  setOrdersRetryVersion: Dispatch<SetStateAction<number>>;
  ordersPage: number;
  ordersTotalPages: number;
}>;

//===================================================================

export function ClientOrdersTab({
  orderNumberSearch,
  setOrderNumberSearch,
  orderCommentSearch,
  setOrderCommentSearch,
  orderFiltersCount,
  isOrdersFiltersOpen,
  setIsOrdersFiltersOpen,
  ordersRowsPerPage,
  setOrdersRowsPerPage,
  orderSearchKey,
  setOrdersPageState,
  ordersStatus,
  orders,
  ordersTotal,
  ordersError,
  setOrdersRetryVersion,
  ordersPage,
  ordersTotalPages,
}: OrderTabProps) {
  return (
    <div className={css.sectionStack}>
      <section className={css.sectionCard}>
        <h2>Client orders</h2>

        <div className={css.searchGrid}>
          <SearchInput
            id="client-order-number-search"
            label="Order number search"
            value={orderNumberSearch}
            placeholder="Order number"
            isActive={Boolean(orderNumberSearch)}
            onChange={setOrderNumberSearch}
          />

          <SearchInput
            id="client-order-comment-search"
            label="Client comment search"
            value={orderCommentSearch}
            placeholder="Client comment"
            isActive={Boolean(orderCommentSearch)}
            onChange={setOrderCommentSearch}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={orderFiltersCount}
              controlsId="client-orders-filters-panel"
              isExpanded={isOrdersFiltersOpen}
              className={css.filterButton}
              onClick={() => setIsOrdersFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.sectionCard}>
        <div className={css.tableStack}>
          <div className={css.tableToolbar}>
            <div className={css.rowsControl}>
              <RowsPerPageSelect
                id="client-orders-rows-per-page"
                value={ordersRowsPerPage}
                options={PRODUCT_ROWS_PER_PAGE_OPTIONS}
                onChange={(value) => {
                  setOrdersRowsPerPage(value);
                  setOrdersPageState({
                    searchKey: orderSearchKey,
                    page: 1,
                  });
                }}
              />
            </div>

            {ordersStatus === 'success' ? (
              <CountLabel
                className={css.countLabel}
                shown={orders.length}
                total={ordersTotal}
                label="orders"
              />
            ) : null}
          </div>

          {ordersStatus === 'error' ? (
            <div role="alert">
              <p className={css.errorText}>{ordersError}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setOrdersRetryVersion((version) => version + 1)}
              >
                Retry orders
              </Button>
            </div>
          ) : (
            <DataTable
              columns={ORDER_COLUMNS}
              items={orders}
              getItemKey={(order) => String(order.id)}
              isLoading={ordersStatus === 'idle' || ordersStatus === 'loading'}
              minWidth={0}
              labels={{
                loading: 'Loading client orders...',
                empty: 'No orders match the selected filters.',
              }}
            />
          )}

          {ordersStatus === 'success' ? (
            <PaginationView
              currentPage={ordersPage}
              totalPages={ordersTotalPages}
              ariaLabel="Client orders pagination"
              onPageChange={(page) =>
                setOrdersPageState({ searchKey: orderSearchKey, page })
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
