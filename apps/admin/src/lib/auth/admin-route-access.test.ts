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

test('only an active admin can access private admin routes', () => {
  const activeAdmin = {
    ...BASE_USER,
    role: 'admin',
    status: 'active',
  } satisfies AuthUser;

  const blockedAdmin = {
    ...BASE_USER,
    role: 'admin',
    status: 'blocked',
  } satisfies AuthUser;

  const activeClient = {
    ...BASE_USER,
    role: 'client',
    status: 'active',
  } satisfies AuthUser;

  const activePharmacyOwner = {
    ...BASE_USER,
    role: 'pharmacy',
    status: 'active',
  } satisfies AuthUser;

  assert.equal(canAccessAdminPrivateRoutes(activeAdmin), true);
  assert.equal(canAccessAdminPrivateRoutes(blockedAdmin), false);
  assert.equal(canAccessAdminPrivateRoutes(activeClient), false);
  assert.equal(canAccessAdminPrivateRoutes(activePharmacyOwner), false);
});
