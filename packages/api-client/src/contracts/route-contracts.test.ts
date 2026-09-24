import assert from 'node:assert/strict';
import test from 'node:test';

import { apiRoutes } from './backend-routes';

import { InvalidRouteSegmentError, encodeRouteSegment } from './route-segment';

//===================================================================

test('uses resource-oriented backend route builders', () => {
  const id = '64b64b64b64b64b64b64b64b';

  assert.equal(apiRoutes.admin.accessMe, '/admin/access/me');

  assert.equal(
    apiRoutes.admin.employees.myProfile,
    '/admin/employees/me/profile'
  );

  assert.equal(
    apiRoutes.admin.employees.myDocuments,
    '/admin/employees/me/documents'
  );

  assert.equal(
    apiRoutes.admin.employees.myDocument(id),
    `/admin/employees/me/documents/${id}`
  );

  assert.equal(apiRoutes.admin.audit.list, '/admin/audit');
  assert.equal(apiRoutes.admin.audit.details(id), `/admin/audit/${id}`);

  assert.equal(
    apiRoutes.productRequests.articleAvailability,
    '/product-requests/article-availability'
  );

  assert.equal(
    apiRoutes.products.myPharmacy(id),
    `/products/${id}/my-pharmacy`
  );

  assert.equal(apiRoutes.products.managementList, '/products/management');

  assert.equal(
    apiRoutes.products.managementStatistics,
    '/products/management/statistics'
  );

  assert.equal(
    apiRoutes.productRequests.statistics,
    '/product-requests/statistics'
  );

  assert.equal(
    apiRoutes.products.managementDetails(id),
    `/products/management/${id}`
  );

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
