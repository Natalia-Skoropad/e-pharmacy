import assert from 'node:assert/strict';
import test from 'node:test';

import type { PharmacyOrdersResponse } from '@/lib/orders/orders';
import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

import {
  INITIAL_ORDERS_PAGE_RESOURCE_STATE,
  beginOrdersLoad,
  completeOrdersLoad,
  failOrdersLoad,
} from './orders-page-resource-state';

//===================================================================

const EMPTY_RESPONSE: PharmacyOrdersResponse = {
  items: [],
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  statistics: DEFAULT_ORDER_STATISTICS,
  earliestCreatedAt: null,
};

//===================================================================

test('successful empty orders response is represented as success, not an error', () => {
  const state = completeOrdersLoad(EMPTY_RESPONSE);

  assert.equal(state.status, 'success');
  assert.deepEqual(state.orders, []);
  assert.equal(state.totalOrders, 0);
  assert.equal(state.totalPages, 0);
});

//===================================================================

test('failed initial orders request is represented as error instead of successful empty data', () => {
  const state = failOrdersLoad(
    beginOrdersLoad(INITIAL_ORDERS_PAGE_RESOURCE_STATE),
    'Could not load orders.'
  );

  assert.equal(state.status, 'error');
  assert.equal(state.errorMessage, 'Could not load orders.');
  assert.deepEqual(state.orders, []);
  assert.equal(state.totalOrders, 0);
});

//===================================================================

test('refresh failure preserves the last successful snapshot while marking it unavailable', () => {
  const successful = completeOrdersLoad({
    ...EMPTY_RESPONSE,
    items: [
      {
        id: '507f1f77bcf86cd799439011',
        orderNumber: 'ORD-TEST',
        orderDate: '2026-09-16T10:00:00.000Z',
        pharmacyName: 'Test Pharmacy',
        client: 'Test Client',
        clientId: '507f1f77bcf86cd799439012',
        clientPhotoUrl: null,
        deliveryMethod: 'pickup',
        paymentMethod: 'cash',
        clientComment: '',
        totalQuantity: 1,
        totalAmount: 100,
        status: 'in_progress',
        createdByType: 'manager',
        items: [],
      },
    ],
    total: 1,
    totalPages: 1,
  });

  const failed = failOrdersLoad(
    beginOrdersLoad(successful),
    'Could not refresh orders.'
  );

  assert.equal(failed.status, 'error');
  assert.equal(failed.totalOrders, 1);
  assert.equal(failed.totalPages, 1);
  assert.equal(failed.orders.length, 1);
  assert.equal(failed.orders[0]?.orderNumber, 'ORD-TEST');
});
