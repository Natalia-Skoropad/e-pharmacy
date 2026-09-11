import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrdersPath, parseOrdersSegments } from '@/lib/orders/order-paths';
import { DEFAULT_ORDERS_FILTERS } from '@/lib/orders/orders-filters';

import {
  buildOwnProductsPath,
  parseOwnProductsSegments,
} from '@/lib/products/own-product-paths';

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
