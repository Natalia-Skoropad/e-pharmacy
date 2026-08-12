import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

test('checkout rejects stale revision/fingerprint before stock reservation or order creation', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/order.service.ts'),
    'utf8'
  );

  const checkoutStart = source.indexOf(
    'export async function checkoutOrderService'
  );

  const checkoutSource = source.slice(checkoutStart);

  const revisionGuard = checkoutSource.indexOf(
    'cart.revision !== input.expectedCartRevision'
  );

  const fingerprintGuard = checkoutSource.indexOf(
    'currentGroupFingerprint !== input.groupFingerprint'
  );

  const validateCart = checkoutSource.indexOf(
    'validateCheckoutCartItemsOrThrow'
  );

  const reserveStock = checkoutSource.indexOf('await reserveOfferStock');

  const createOrder = checkoutSource.indexOf(
    'const order = await Order.create'
  );

  for (const index of [
    revisionGuard,
    fingerprintGuard,
    validateCart,
    reserveStock,
    createOrder,
  ]) {
    assert.notEqual(index, -1);
  }

  assert.ok(revisionGuard < reserveStock);
  assert.ok(fingerprintGuard < reserveStock);
  assert.ok(validateCart < reserveStock);
  assert.ok(revisionGuard < createOrder);
  assert.ok(fingerprintGuard < createOrder);
  assert.match(checkoutSource, /CHECKOUT_CART_CHANGED_ERROR_CODE/);

  assert.match(
    checkoutSource,
    /\{ _id: cart\._id, revision: input\.expectedCartRevision \}/
  );
});
