import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderPath, getOrderIdFromPathParam } from './route-builders';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

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
