import assert from 'node:assert/strict';
import test from 'node:test';

import { apiRoutes } from './backend-routes';
import {
  InvalidRouteSegmentError,
  encodeRouteSegment,
} from './route-segment';

//===================================================================

test('uses resource-oriented backend route builders', () => {
  const id = '64b64b64b64b64b64b64b64b';

  assert.equal(
    apiRoutes.productRequests.articleAvailability,
    '/product-requests/article-availability'
  );
  assert.equal(apiRoutes.products.myPharmacy(id), `/products/${id}/my-pharmacy`);
  assert.equal(apiRoutes.cart.item(id), `/cart/items/${id}`);
});

//===================================================================

test('rejects unsafe or already encoded route segments', () => {
  assert.equal(encodeRouteSegment('abc-123'), 'abc-123');
  assert.equal(encodeRouteSegment('ліки'), encodeURIComponent('ліки'));

  for (const value of ['', '   ', '.', '..', 'a/b', 'a\\b', 'a%2Fb', 'a\n']) {
    assert.throws(() => encodeRouteSegment(value), InvalidRouteSegmentError);
  }
});
