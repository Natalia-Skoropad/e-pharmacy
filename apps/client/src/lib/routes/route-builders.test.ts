import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCheckoutPath,
  buildOrderPath,
  buildPharmacyPath,
  buildProductPath,
  getCheckoutPharmacyIdFromPathParam,
  getLegacyCheckoutRedirectPath,
  getOrderIdFromPathParam,
} from './route-builders';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

//===================================================================

test('builds short root-level product and pharmacy detail paths with typed IDs', () => {
  assert.equal(buildProductPath('Pain Relief', ID), `/pain-relief-pr${ID}`);
  assert.equal(buildPharmacyPath('Health Hub', ID), `/health-hub-ph${ID}`);
});

//===================================================================

test('uses the backend canonical public slug when it is provided', () => {
  assert.equal(
    buildProductPath('Ignored', ID, `canonical-product-pr${ID}`),
    `/canonical-product-pr${ID}`
  );

  assert.equal(
    buildPharmacyPath('Ignored', ID, `canonical-pharmacy-ph${ID}`),
    `/canonical-pharmacy-ph${ID}`
  );
});

//===================================================================

test('builds typed checkout pharmacy paths and redirects legacy checkout slugs', () => {
  const canonical = buildCheckoutPath('PharmaPlus Kharkiv 61', ID);

  assert.equal(canonical, `/checkout/pharmaplus-kharkiv-61-ph${ID}`);

  assert.equal(
    getCheckoutPharmacyIdFromPathParam(`pharmaplus-kharkiv-61-ph${ID}`),
    ID
  );

  assert.equal(
    getLegacyCheckoutRedirectPath(`pharmaplus-kharkiv-61-${ID}`),
    canonical
  );

  assert.equal(getLegacyCheckoutRedirectPath(`pharmaplus-pr${ID}`), null);
});

//===================================================================

test('builds and parses a canonical order slug with Unicode order numbers', () => {
  const path = buildOrderPath({ id: ID, orderNumber: 'Замовлення № 42' });

  assert.match(path, new RegExp(`${ID}$`));
  assert.equal(getOrderIdFromPathParam(path.split('/').at(-1) ?? ''), ID);
});

//===================================================================

test('rejects malformed order route identifiers', () => {
  assert.equal(getOrderIdFromPathParam('order--invalid'), null);
  assert.throws(() => buildOrderPath({ id: 'invalid', orderNumber: '42' }));
});
