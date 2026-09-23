import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_ACCESS_ERROR_CODES,
  parseAdminAccessResponse,
} from './admin-access';

import { ADMIN_PERMISSIONS } from './admin-permissions';
import { canAdmin } from './can-admin';

//===================================================================

test('admin access parser accepts known permissions and normalizes duplicates', () => {
  const parsed = parseAdminAccessResponse({
    access: {
      status: 'active',
      isPlatformOwner: false,

      permissions: [
        ADMIN_PERMISSIONS.products.view,
        ADMIN_PERMISSIONS.orders.view,
        ADMIN_PERMISSIONS.products.view,
      ],
    },
  });

  assert.deepEqual(parsed.access.permissions, [
    ADMIN_PERMISSIONS.orders.view,
    ADMIN_PERMISSIONS.products.view,
  ]);
});

//===================================================================

test('admin access parser fails closed for malformed and unknown permissions', () => {
  assert.throws(() => parseAdminAccessResponse(null), /invalid admin access/i);

  assert.throws(
    () =>
      parseAdminAccessResponse({
        access: {
          status: 'active',
          isPlatformOwner: false,
          permissions: ['products.destroyEverything'],
        },
      }),
    /unknown permission/i
  );

  assert.throws(
    () =>
      parseAdminAccessResponse({
        access: {
          status: 'revoked',
          isPlatformOwner: false,
          permissions: [],
        },
      }),
    /invalid admin access/i
  );
});

//===================================================================

test('frontend permission helper grants exact access and Platform Owner bypass only', () => {
  const employee = {
    status: 'active' as const,
    isPlatformOwner: false,
    permissions: [ADMIN_PERMISSIONS.products.view],
  };

  const owner = {
    status: 'active' as const,
    isPlatformOwner: true,
    permissions: [],
  };

  assert.equal(canAdmin(employee, ADMIN_PERMISSIONS.products.view), true);
  assert.equal(canAdmin(employee, ADMIN_PERMISSIONS.products.edit), false);
  assert.equal(canAdmin(owner, ADMIN_PERMISSIONS.products.delete), true);
  assert.equal(canAdmin(owner, 'products.unknown'), false);
});

//===================================================================

test('authorization error codes stay stable for access state classification', () => {
  assert.equal(ADMIN_ACCESS_ERROR_CODES.ACCESS_REVOKED, 'ADMIN_ACCESS_REVOKED');

  assert.equal(
    ADMIN_ACCESS_ERROR_CODES.PERMISSION_DENIED,
    'ADMIN_PERMISSION_DENIED'
  );
});
