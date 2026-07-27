import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PHARMACY_ROUTES,
  getPharmacyOrderPath,
  getPharmacyRequestPath,
} from './pharmacy-routes';

//===================================================================

test('exposes app-local pharmacy routes', () => {
  assert.equal(PHARMACY_ROUTES.DASHBOARD, '/pharmacy/dashboard');
  assert.equal(
    PHARMACY_ROUTES.PRODUCT_REQUEST_NEW,
    '/pharmacy/product-requests/new'
  );
});

//===================================================================

test('encodes validated entity IDs in dynamic routes', () => {
  assert.equal(
    getPharmacyOrderPath('order / Київ'),
    '/pharmacy/orders/order%20%2F%20%D0%9A%D0%B8%D1%97%D0%B2'
  );
  assert.equal(
    getPharmacyRequestPath(' request-1 '),
    '/pharmacy/product-requests/request-1'
  );
});

//===================================================================

test('rejects empty route parameters', () => {
  assert.throws(() => getPharmacyOrderPath('   '), TypeError);
});
