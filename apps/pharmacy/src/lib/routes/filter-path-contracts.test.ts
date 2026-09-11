import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClientsPath,
  parseClientsSegments,
} from '@/lib/clients/client-paths';

import { buildOrdersPath, parseOrdersSegments } from '@/lib/orders/order-paths';
import { DEFAULT_CLIENTS_FILTERS } from '@/lib/clients/client-paths';
import { DEFAULT_ORDERS_FILTERS } from '@/lib/orders/orders-filters';

import {
  buildAllProductsPath,
  parseAllProductsSegments,
} from '@/lib/products/all-product-paths';

import {
  buildOwnProductsPath,
  parseOwnProductsSegments,
} from '@/lib/products/own-product-paths';

import { DEFAULT_ALL_PRODUCTS_FILTERS } from '@/lib/products/all-products-filters';
import { DEFAULT_OWN_PRODUCTS_FILTERS } from '@/lib/products/own-products-filters';

import {
  buildProductRequestsPath,
  parseProductRequestsSegments,
} from '@/lib/product-requests/product-request-paths';

import { DEFAULT_PRODUCT_REQUESTS_FILTERS } from '@/lib/product-requests/product-requests';

//===================================================================

function segments(path: string): string[] {
  return path.split('/').filter(Boolean).slice(2);
}

//===================================================================

test('order status route uses canonical hyphenated slug and roundtrips', () => {
  const state = { ...DEFAULT_ORDERS_FILTERS, status: 'in_progress' as const };
  const path = buildOrdersPath(state);

  assert.equal(path, '/pharmacy/orders/status-in-progress');
  assert.deepEqual(parseOrdersSegments({ filters: segments(path) }), state);
});

//===================================================================

test('own product stock route roundtrips through its domain builder', () => {
  const state = { ...DEFAULT_OWN_PRODUCTS_FILTERS, stock: 'reserved' as const };
  const path = buildOwnProductsPath(state);

  assert.equal(path, '/pharmacy/products/stock-reserved');

  assert.deepEqual(
    parseOwnProductsSegments({ filters: segments(path) }),
    state
  );
});

//===================================================================

test('product request status route roundtrips through its domain builder', () => {
  const state = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    status: 'in_progress' as const,
  };

  const path = buildProductRequestsPath(state);

  assert.equal(path, '/pharmacy/product-requests/status-in-progress');

  assert.deepEqual(
    parseProductRequestsSegments({ filters: segments(path) }),
    state
  );
});

//===================================================================

test('client non-PII filters roundtrip through the canonical client path builder', () => {
  const state = {
    ...DEFAULT_CLIENTS_FILTERS,
    firstOrderDate: { from: '2026-08-01', to: '2026-08-31' },
    status: 'active' as const,
    successfulOrders: 'repeat' as const,
  };

  const path = buildClientsPath(state);

  assert.deepEqual(parseClientsSegments({ filters: segments(path) }), state);
});

//===================================================================

test('all-products filters roundtrip through the canonical domain builder', () => {
  const state = {
    ...DEFAULT_ALL_PRODUCTS_FILTERS,
    name: 'vitamin c',
    article: 'vit-100',
    status: 'active' as const,
    addedToMyPharmacy: 'no' as const,
  };

  const path = buildAllProductsPath(state);

  assert.deepEqual(
    parseAllProductsSegments({ filters: segments(path) }),
    state
  );
});

//===================================================================

test('invalid known enum segments normalize to canonical defaults', () => {
  const orders = parseOrdersSegments({ filters: ['status-impossible'] });
  assert.equal(orders.status, DEFAULT_ORDERS_FILTERS.status);
  assert.equal(buildOrdersPath(orders), '/pharmacy/orders');

  const products = parseAllProductsSegments({
    filters: ['added-to-my-pharmacy-maybe'],
  });

  assert.equal(
    products.addedToMyPharmacy,
    DEFAULT_ALL_PRODUCTS_FILTERS.addedToMyPharmacy
  );

  assert.equal(buildAllProductsPath(products), '/pharmacy/all-products');
});

//===================================================================

test('unknown filter segments normalize deterministically to canonical base routes', () => {
  const cases = [
    {
      parse: () => parseOrdersSegments({ filters: ['random-filter-value'] }),
      build: buildOrdersPath,
      expectedState: DEFAULT_ORDERS_FILTERS,
      expectedPath: '/pharmacy/orders',
    },
    {
      parse: () => parseClientsSegments({ filters: ['random-filter-value'] }),
      build: buildClientsPath,
      expectedState: DEFAULT_CLIENTS_FILTERS,
      expectedPath: '/pharmacy/clients',
    },
    {
      parse: () =>
        parseOwnProductsSegments({ filters: ['random-filter-value'] }),
      build: buildOwnProductsPath,
      expectedState: DEFAULT_OWN_PRODUCTS_FILTERS,
      expectedPath: '/pharmacy/products',
    },
    {
      parse: () =>
        parseAllProductsSegments({ filters: ['random-filter-value'] }),
      build: buildAllProductsPath,
      expectedState: DEFAULT_ALL_PRODUCTS_FILTERS,
      expectedPath: '/pharmacy/all-products',
    },
    {
      parse: () =>
        parseProductRequestsSegments({ filters: ['random-filter-value'] }),
      build: buildProductRequestsPath,
      expectedState: DEFAULT_PRODUCT_REQUESTS_FILTERS,
      expectedPath: '/pharmacy/product-requests',
    },
  ] as const;

  for (const { parse, build, expectedState, expectedPath } of cases) {
    const state = parse();
    assert.deepEqual(state, expectedState);
    assert.equal(build(state as never), expectedPath);
  }
});
