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

test('encodes validated entity IDs in every dynamic route', () => {
  assert.equal(
    getPharmacyOrderPath('order / Київ'),
    '/pharmacy/orders/order%20%2F%20%D0%9A%D0%B8%D1%97%D0%B2'
  );

  assert.equal(
    getPharmacyClientPath(' client-1 '),
    '/pharmacy/clients/client-1'
  );

  assert.equal(
    getPharmacyProductPath('product/1'),
    '/pharmacy/products/product%2F1'
  );

  assert.equal(
    getPharmacyAllProductPath('all product'),
    '/pharmacy/all-products/all%20product'
  );

  assert.equal(
    getPharmacyRequestPath(' request-1 '),
    '/pharmacy/product-requests/request-1'
  );
});

//===================================================================

test('rejects empty route parameters', () => {
  for (const builder of [
    getPharmacyOrderPath,
    getPharmacyClientPath,
    getPharmacyProductPath,
    getPharmacyAllProductPath,
    getPharmacyRequestPath,
  ]) {
    assert.throws(() => builder('   '), TypeError);
  }
});

//===================================================================

test('does not expose a route builder for a missing request edit page', () => {
  assert.equal('getPharmacyRequestEditPath' in pharmacyRoutes, false);
});
