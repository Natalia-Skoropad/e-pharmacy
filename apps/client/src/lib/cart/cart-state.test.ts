import assert from 'node:assert/strict';
import test from 'node:test';

import type { Cart } from '@e-pharmacy/types/cart';

import {
  beginCartLoad,
  completeCartLoad,
  createInitialCartState,
  failCartLoad,
  getCartStateCart,
} from './cart-state';

//===================================================================

const CART: Cart = {
  revision: 3,
  items: [],
  totalItems: 2,
  totalPrice: 150,
  issues: [],
};

//===================================================================

test('models initial load, success and refresh without ambiguous flags', () => {
  const initial = createInitialCartState('session-a');
  const loading = beginCartLoad(initial, 'session-a');
  const success = completeCartLoad('session-a', CART);
  const refreshing = beginCartLoad(success, 'session-a');

  assert.equal(initial.status, 'idle');
  assert.equal(loading.status, 'loading');
  assert.equal(success.status, 'success');
  assert.equal(refreshing.status, 'refreshing');
  assert.equal(getCartStateCart(refreshing), CART);
});

//===================================================================

test('load failure preserves the last confirmed cart only', () => {
  const success = completeCartLoad('session-a', CART);
  const error = new Error('offline');
  const failedRefresh = failCartLoad(success, 'session-a', error);
  
  const failedInitialLoad = failCartLoad(
    createInitialCartState('session-a'),
    'session-a',
    error
  );

  assert.equal(failedRefresh.status, 'error');
  assert.equal(getCartStateCart(failedRefresh), CART);
  assert.equal(getCartStateCart(failedInitialLoad), null);
});

//===================================================================

test('a new session starts idle without resurrecting the previous cart', () => {
  const previousSession = completeCartLoad('session-a', CART);
  const reloggedSession = createInitialCartState('session-b');

  assert.equal(getCartStateCart(previousSession), CART);
  assert.equal(reloggedSession.status, 'idle');
  assert.equal(getCartStateCart(reloggedSession), null);
});

//===================================================================

test('does not carry a previous owner cart into loading or error state', () => {
  const previous = completeCartLoad('session-a', CART);

  const loading = beginCartLoad(previous, 'session-b');
  const failed = failCartLoad(previous, 'session-b', new Error('offline'));

  assert.equal(loading.status, 'loading');
  assert.equal(getCartStateCart(loading), null);
  assert.equal(failed.status, 'error');
  assert.equal(getCartStateCart(failed), null);
});
