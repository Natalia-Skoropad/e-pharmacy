import assert from 'node:assert/strict';
import test from 'node:test';

import * as pharmacyRoutes from './pharmacy-routes';

//===================================================================

const {
  PHARMACY_ROUTES,
  getPharmacyAllProductPath,
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getPharmacyProductPath,
  getPharmacyRequestPath,
} = pharmacyRoutes;

//===================================================================

const ENTITY_IDS = {
  order: '507f1f77bcf86cd799439011',
  client: '507f1f77bcf86cd799439012',
  product: '507f1f77bcf86cd799439013',
  allProduct: '507f1f77bcf86cd799439014',
  request: '507f1f77bcf86cd799439015',
} as const;

//===================================================================

test('exposes app-local pharmacy routes', () => {
  assert.deepEqual(PHARMACY_ROUTES, {
    ROOT: '/pharmacy',
    DASHBOARD: '/pharmacy/dashboard',
    ORDERS: '/pharmacy/orders',
    ORDER_NEW: '/pharmacy/orders/new',
    CLIENTS: '/pharmacy/clients',
    PRODUCTS: '/pharmacy/products',
    ALL_PRODUCTS: '/pharmacy/all-products',
    PRODUCT_REQUESTS: '/pharmacy/product-requests',
    PRODUCT_REQUEST_NEW: '/pharmacy/product-requests/new',
    PROFILE: '/pharmacy/profile',
  });
});

//===================================================================

test('builds dynamic routes only from validated entity IDs', () => {
  assert.equal(
    getPharmacyOrderPath(ENTITY_IDS.order),
    `/pharmacy/orders/${ENTITY_IDS.order}`
  );

  assert.equal(
    getPharmacyClientPath(` ${ENTITY_IDS.client} `),
    `/pharmacy/clients/${ENTITY_IDS.client}`
  );

  assert.equal(
    getPharmacyProductPath(ENTITY_IDS.product),
    `/pharmacy/products/${ENTITY_IDS.product}`
  );

  assert.equal(
    getPharmacyAllProductPath(ENTITY_IDS.allProduct),
    `/pharmacy/all-products/${ENTITY_IDS.allProduct}`
  );

  assert.equal(
    getPharmacyRequestPath(ENTITY_IDS.request),
    `/pharmacy/product-requests/${ENTITY_IDS.request}`
  );
});

//===================================================================

test('rejects empty and malformed dynamic route IDs', () => {
  for (const builder of [
    getPharmacyOrderPath,
    getPharmacyClientPath,
    getPharmacyProductPath,
    getPharmacyAllProductPath,
    getPharmacyRequestPath,
  ]) {
    for (const invalidId of [
      '',
      '   ',
      'client-1',
      'product/1',
      '507f1f77bcf86cd79943901',
      '507f1f77bcf86cd79943901z',
    ]) {
      assert.throws(() => builder(invalidId), TypeError);
    }
  }
});

//===================================================================

test('does not expose a route builder for a missing request edit page', () => {
  assert.equal('getPharmacyRequestEditPath' in pharmacyRoutes, false);
});
