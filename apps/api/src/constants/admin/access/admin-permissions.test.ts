import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_PERMISSIONS,
  isAdminPermission,
  normalizeAdminPermissions,
} from './admin-permissions';

//===============================================================

test('admin permission registry uses stable resource.action values', () => {
  assert.equal(ADMIN_PERMISSIONS.products.edit, 'products.edit');

  assert.equal(
    ADMIN_PERMISSIONS.employees.managePermissions,
    'employees.managePermissions'
  );

  assert.equal(ADMIN_PERMISSIONS.positions.create, 'positions.create');
  assert.equal(ADMIN_PERMISSIONS.audit.view, 'audit.view');
});

//===============================================================

test('admin permissions fail closed for unknown values', () => {
  assert.equal(isAdminPermission('products.edit'), true);
  assert.equal(isAdminPermission('products.destroyEverything'), false);

  assert.throws(
    () => normalizeAdminPermissions(['products.view', 'unknown.permission']),
    /unknown permission/i
  );
});

//===============================================================

test('admin permissions normalize duplicates deterministically', () => {
  assert.deepEqual(
    normalizeAdminPermissions([
      ADMIN_PERMISSIONS.products.view,
      ADMIN_PERMISSIONS.orders.view,
      ADMIN_PERMISSIONS.products.view,
    ]),

    [ADMIN_PERMISSIONS.orders.view, ADMIN_PERMISSIONS.products.view]
  );
});
