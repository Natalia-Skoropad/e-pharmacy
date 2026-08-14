import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import {
  createClientAuthIdentity,
  createClientSessionLifecycle,
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
  revision: '2026-08-14T12:00:00.000Z',
} as AuthUser;

//===================================================================

test('same auth identity receives a new owner key for every mounted session', () => {
  const authIdentity = createClientAuthIdentity('authenticated', ACTIVE_CLIENT);

  const firstSession = createClientSessionLifecycle(authIdentity);
  const secondSession = createClientSessionLifecycle(authIdentity);

  assert.notEqual(
    createClientSessionOwnerKey(firstSession),
    createClientSessionOwnerKey(secondSession)
  );

  assert.ok(secondSession.generation > firstSession.generation);
});

//===================================================================

test('auth identity includes authentication, role and account status', () => {
  assert.notEqual(
    createClientAuthIdentity('authenticated', ACTIVE_CLIENT),
    createClientAuthIdentity('unauthenticated', null)
  );

  assert.notEqual(
    createClientAuthIdentity('authenticated', ACTIVE_CLIENT),

    createClientAuthIdentity('authenticated', {
      ...ACTIVE_CLIENT,
      status: 'blocked',
    })
  );
});
