import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import {
  advanceClientSessionLifecycle,
  createClientAuthIdentity,
  createClientSessionOwnerKey,
} from './client-session-lifecycle';

//===================================================================

const ACTIVE_CLIENT: AuthUser = {
  id: '507f1f77bcf86cd799439011',
  name: 'Client',
  email: 'client@example.com',
  phone: '+380501234567',
  role: 'client',
  status: 'active',
} as AuthUser;

//===================================================================

test('same-user relogin receives a new session owner key', () => {
  const authenticated = createClientAuthIdentity(
    'authenticated',
    ACTIVE_CLIENT
  );
  const unauthenticated = createClientAuthIdentity('unauthenticated', null);

  const initial = { authIdentity: authenticated, generation: 0 } as const;
  const afterLogout = advanceClientSessionLifecycle(initial, unauthenticated);
  const afterRelogin = advanceClientSessionLifecycle(
    afterLogout,
    authenticated
  );

  assert.notEqual(
    createClientSessionOwnerKey(initial),
    createClientSessionOwnerKey(afterRelogin)
  );
  assert.equal(afterRelogin.generation, 2);
});

//===================================================================

test('stable auth identity keeps the same generation', () => {
  const identity = createClientAuthIdentity('authenticated', ACTIVE_CLIENT);
  const lifecycle = { authIdentity: identity, generation: 4 } as const;

  assert.equal(advanceClientSessionLifecycle(lifecycle, identity), lifecycle);
});
