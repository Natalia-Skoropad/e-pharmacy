import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDebouncedOrdersTextFilters,
  getOrdersTextFilterState,
  syncOrdersFiltersFromRoute,
} from './orders-page-filter-state';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from '@/lib/orders/orders-filters';

//===================================================================

function createFilters(
  overrides: Partial<OrdersFilterState> = {}
): OrdersFilterState {
  return {
    ...DEFAULT_ORDERS_FILTERS,
    ...overrides,
    date: overrides.date
      ? { ...overrides.date }
      : { ...DEFAULT_ORDERS_FILTERS.date },
  };
}

//===================================================================

test('text filters use settled debounce values while non-text filters apply immediately', () => {
  const currentFilters = createFilters({
    client: 'Anna',
    orderNumber: 'EP-2026',
    status: 'successful',
    paymentMethod: 'bank_transfer',
  });

  const settledTextFilters = getOrdersTextFilterState(
    createFilters({ client: 'Ann', orderNumber: 'EP-20' })
  );

  const requestFilters = applyDebouncedOrdersTextFilters(
    currentFilters,
    settledTextFilters
  );

  assert.equal(requestFilters.client, 'Ann');
  assert.equal(requestFilters.orderNumber, 'EP-20');
  assert.equal(requestFilters.status, 'successful');
  assert.equal(requestFilters.paymentMethod, 'bank_transfer');
});

//===================================================================

test('route synchronization restores Back and Forward filter state', () => {
  const filtersA = createFilters({
    client: 'Anna',
    status: 'new',
  });

  const filtersB = createFilters({
    client: 'Maria',
    status: 'successful',
    deliveryMethod: 'postal_delivery',
  });

  let currentFilters = filtersB;

  currentFilters = syncOrdersFiltersFromRoute(currentFilters, filtersA);
  assert.deepEqual(currentFilters, filtersA);

  currentFilters = syncOrdersFiltersFromRoute(currentFilters, filtersB);
  assert.deepEqual(currentFilters, filtersB);
});

//===================================================================

test('route synchronization keeps the existing object when filters are already canonical', () => {
  const filters = createFilters({ status: 'in_progress' });

  const synchronized = syncOrdersFiltersFromRoute(filters, {
    ...filters,
    date: { ...filters.date },
  });

  assert.equal(synchronized, filters);
});
