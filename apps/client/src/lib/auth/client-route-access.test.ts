import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { canAccessClientPrivateRoutes } from './client-route-access';

//===================================================================

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: '507f1f77bcf86cd799439011',
    name: 'Client',
    email: 'client@example.com',
    phone: '+380501234567',
    role: 'client',
    status: 'active',
    ...overrides,
  } as AuthUser;
}

//===================================================================

test('allows only active client accounts', () => {
  assert.equal(canAccessClientPrivateRoutes(createUser()), true);

  assert.equal(
    canAccessClientPrivateRoutes(createUser({ status: 'blocked' })),
    false
  );

  assert.equal(
    canAccessClientPrivateRoutes(createUser({ role: 'pharmacy' })),
    false
  );

  assert.equal(
    canAccessClientPrivateRoutes(createUser({ role: 'admin' })),
    false
  );
});
