import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_ACCESS_STATUSES } from '../constants/admin-access';
import { ADMIN_PERMISSIONS } from '../constants/admin-permissions';
import type { AdminAuthorization } from '../types/admin-access';

import {
  assertCanManageAdminPermissions,
  assertCanRevokeAdminAccess,
} from './admin-access-policy';

import { hasAdminPermission } from './admin-permission-evaluator';

//===============================================================

function access(
  userId: string,
  permissions: AdminAuthorization['permissions'] = [],
  isPlatformOwner = false
): AdminAuthorization {
  return {
    userId,
    status: ADMIN_ACCESS_STATUSES.ACTIVE,
    isPlatformOwner,
    permissions,
  };
}

//===============================================================

function getErrorCode(callback: () => unknown): string | undefined {
  try {
    callback();
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  }
}

//===============================================================

test('regular admin access requires the exact permission while Platform Owner bypasses it', () => {
  const editor = access('editor', [ADMIN_PERMISSIONS.products.edit]);
  const owner = access('owner', [], true);

  assert.equal(
    hasAdminPermission(editor, ADMIN_PERMISSIONS.products.edit),
    true
  );

  assert.equal(
    hasAdminPermission(editor, ADMIN_PERMISSIONS.products.delete),
    false
  );

  assert.equal(
    hasAdminPermission(owner, ADMIN_PERMISSIONS.products.delete),
    true
  );

  assert.equal(hasAdminPermission(owner, 'products.unknown'), false);

  assert.equal(
    hasAdminPermission(null, ADMIN_PERMISSIONS.products.view),
    false
  );
});

//===============================================================

test('delegated permission managers can grant only their own permission subset', () => {
  const actor = access('actor', [
    ADMIN_PERMISSIONS.employees.managePermissions,
    ADMIN_PERMISSIONS.products.view,
  ]);

  const target = access('target');

  assert.deepEqual(
    assertCanManageAdminPermissions({
      actor,
      target,
      nextPermissions: [ADMIN_PERMISSIONS.products.view],
    }),

    [ADMIN_PERMISSIONS.products.view]
  );

  assert.equal(
    getErrorCode(() =>
      assertCanManageAdminPermissions({
        actor,
        target,
        nextPermissions: [ADMIN_PERMISSIONS.audit.view],
      })
    ),

    'ADMIN_PERMISSION_DELEGATION_DENIED'
  );
});

//===============================================================

test('self access and Platform Owner targets remain protected', () => {
  const manager = access('manager', [
    ADMIN_PERMISSIONS.employees.managePermissions,
    ADMIN_PERMISSIONS.employees.revokeAccess,
  ]);

  const owner = access('owner', [], true);

  assert.equal(
    getErrorCode(() =>
      assertCanManageAdminPermissions({
        actor: manager,
        target: manager,
        nextPermissions: [],
      })
    ),

    'ADMIN_SELF_ACCESS_CHANGE_NOT_ALLOWED'
  );

  assert.equal(
    getErrorCode(() =>
      assertCanManageAdminPermissions({
        actor: manager,
        target: owner,
        nextPermissions: [],
      })
    ),

    'ADMIN_OWNER_ACCESS_PROTECTED'
  );

  assert.equal(
    getErrorCode(() =>
      assertCanRevokeAdminAccess({ actor: manager, target: owner })
    ),

    'ADMIN_OWNER_ACCESS_PROTECTED'
  );
});

//===============================================================

test('Platform Owner can assign regular permissions without subset inheritance', () => {
  const owner = access('owner', [], true);
  const employee = access('employee');

  assert.deepEqual(
    assertCanManageAdminPermissions({
      actor: owner,
      target: employee,
      nextPermissions: [
        ADMIN_PERMISSIONS.audit.view,
        ADMIN_PERMISSIONS.positions.delete,
      ],
    }),

    [ADMIN_PERMISSIONS.audit.view, ADMIN_PERMISSIONS.positions.delete]
  );
});
