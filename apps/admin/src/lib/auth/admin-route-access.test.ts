import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { canAccessAdminPrivateRoutes } from './admin-route-access';

//===================================================================

const BASE_USER = {
  id: '64b64b64b64b64b64b64b64b',
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+380501234567',
  revision: '2026-09-23T12:00:00.000Z' as AuthUser['revision'],
} as const;

//===================================================================

function createUser(
  role: AuthUser['role'],
  status: AuthUser['status']
): AuthUser {
  return { ...BASE_USER, role, status };
}

//===================================================================

test('only an active admin can access private admin routes', () => {
  assert.equal(
    canAccessAdminPrivateRoutes(createUser('admin', 'active')),
    true
  );

  assert.equal(
    canAccessAdminPrivateRoutes(createUser('admin', 'blocked')),
    false
  );

  assert.equal(
    canAccessAdminPrivateRoutes(createUser('client', 'active')),
    false
  );

  assert.equal(
    canAccessAdminPrivateRoutes(createUser('pharmacy', 'active')),
    false
  );
});
