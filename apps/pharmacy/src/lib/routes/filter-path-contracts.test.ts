import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClientsPath,
  parseClientsSegments,
} from '@/lib/clients/client-paths';

import {
  buildOrdersPath,
  buildEmbeddedOrdersPath,
  isOrdersFilterSegment,
  parseOrdersSegments,
  parseOrdersPaginationSegments,
} from '@/lib/orders/order-paths';

import { DEFAULT_CLIENTS_FILTERS } from '@/lib/clients/client-paths';
import { DEFAULT_ORDERS_FILTERS } from '@/lib/orders/orders-filters';

import {
  buildAllProductsPath,
  parseAllProductsSegments,
  parseAllProductsPaginationSegments,
  isAllProductsFilterSegment,
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

import {
  CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
} from '@/lib/product-requests/product-requests';

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

test('order client search stays ephemeral and is never persisted in the route', () => {
  const state = {
    ...DEFAULT_ORDERS_FILTERS,
    client: 'Nataliia Skoropad',
    status: 'new' as const,
  };

  assert.equal(buildOrdersPath(state), '/pharmacy/orders/status-new');
  assert.equal(isOrdersFilterSegment('client-nataliia-skoropad'), false);

  assert.deepEqual(
    parseOrdersSegments({ filters: ['client-nataliia-skoropad'] }),
    DEFAULT_ORDERS_FILTERS
  );
});

//===================================================================

test('Orders owner selection, dependent entity IDs and pagination roundtrip', () => {
  const state = {
    ...DEFAULT_ORDERS_FILTERS,
    pharmacyId: '507f1f77bcf86cd799439011',
    clientId: '507f1f77bcf86cd799439012',
    orderId: '507f1f77bcf86cd799439013',
    status: 'successful' as const,
  };

  const paging = { page: 2, perPage: 50 as const };
  const path = buildOrdersPath(state, paging);

  assert.equal(
    path,
    '/pharmacy/orders/pharmacy-id-507f1f77bcf86cd799439011/client-id-507f1f77bcf86cd799439012/order-id-507f1f77bcf86cd799439013/status-successful/per-page-50/page-2'
  );

  assert.deepEqual(parseOrdersSegments({ filters: segments(path) }), state);

  assert.deepEqual(
    parseOrdersPaginationSegments({ filters: segments(path) }),
    paging
  );
});

//===================================================================

test('pharmacy Orders detail routes keep filters scoped to that pharmacy and preserve paging', () => {
  const pharmacyId = '507f1f77bcf86cd799439011';

  const filters = {
    ...DEFAULT_ORDERS_FILTERS,
    pharmacyId,
    clientId: '507f1f77bcf86cd799439012',
    status: 'in_progress' as const,
    date: { from: '2026-07-09', to: '2026-07-12' },
  };

  const pagination = { page: 2, perPage: 50 as const };
  const path = buildEmbeddedOrdersPath(pharmacyId, filters, pagination);

  assert.equal(
    path,
    `/pharmacy/pharmacies/${pharmacyId}/orders/client-id-507f1f77bcf86cd799439012/status-in-progress/date-from-2026-07-09/date-to-2026-07-12/per-page-50/page-2`
  );

  const tail = path.split('/orders/')[1]?.split('/') ?? [];
  const parsed = parseOrdersSegments({ filters: tail });

  assert.deepEqual({ ...parsed, pharmacyId }, filters);

  assert.deepEqual(
    parseOrdersPaginationSegments({ filters: tail }),
    pagination
  );

  assert.throws(
    () =>
      buildEmbeddedOrdersPath(
        pharmacyId,
        { ...filters, pharmacyId: '507f1f77bcf86cd799439099' },
        pagination
      ),
    TypeError
  );
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

test('dynamic and custom product request categories roundtrip without static membership', () => {
  const dynamicState = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    category: 'veterinary_care',
  };

  const dynamicPath = buildProductRequestsPath(dynamicState);

  assert.equal(
    dynamicPath,
    '/pharmacy/product-requests/category-veterinary_care'
  );

  assert.deepEqual(
    parseProductRequestsSegments({ filters: segments(dynamicPath) }),
    dynamicState
  );

  const customState = {
    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
    category: CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER,
  };

  const customPath = buildProductRequestsPath(customState);

  assert.equal(customPath, '/pharmacy/product-requests/category-mode-custom');

  assert.deepEqual(
    parseProductRequestsSegments({ filters: segments(customPath) }),
    customState
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

test('all-products pagination and page size use the same URL segments as the pharmacy registry', () => {
  const filters = {
    ...DEFAULT_ALL_PRODUCTS_FILTERS,
    status: 'active' as const,
    addedToMyPharmacy: 'yes' as const,
  };

  const path = buildAllProductsPath(filters, { page: 3, perPage: 50 });

  assert.equal(
    path,
    '/pharmacy/all-products/status-active/added-to-my-pharmacy-yes/page-3/per-page-50'
  );

  const route = { filters: segments(path) };

  assert.deepEqual(parseAllProductsSegments(route), filters);

  assert.deepEqual(parseAllProductsPaginationSegments(route), {
    page: 3,
    perPage: 50,
  });

  assert.equal(
    buildAllProductsPath(DEFAULT_ALL_PRODUCTS_FILTERS, {
      page: 1,
      perPage: 50,
    }),
    '/pharmacy/all-products/per-page-50'
  );

  assert.equal(
    buildAllProductsPath(DEFAULT_ALL_PRODUCTS_FILTERS, {
      page: 4,
      perPage: 20,
    }),
    '/pharmacy/all-products/page-4'
  );

  assert.equal(isAllProductsFilterSegment('per-page-50'), true);
  assert.equal(isAllProductsFilterSegment('page-4'), true);
  assert.equal(isAllProductsFilterSegment('507f1f77bcf86cd799439011'), false);
});

//===================================================================

test('invalid all-products pagination values normalize to safe canonical defaults', () => {
  const invalid = parseAllProductsPaginationSegments({
    filters: ['page-0', 'per-page-999'],
  });

  assert.deepEqual(invalid, { page: 1, perPage: 20 });

  assert.deepEqual(
    parseAllProductsPaginationSegments({
      filters: ['page-99999999999999999999'],
    }),
    { page: 1, perPage: 20 }
  );

  assert.deepEqual(
    parseAllProductsPaginationSegments({ filters: ['page-2', 'per-page-100'] }),
    { page: 2, perPage: 100 }
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
