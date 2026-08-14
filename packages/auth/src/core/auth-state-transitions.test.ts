import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import {
  createAuthenticatedAuthState,
  createBootstrappingAuthState,
  createUnauthenticatedAuthState,
  createUnavailableAuthState,
} from './auth-state-transitions';

//===================================================================

const user: AuthUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+380000000000',
  role: 'client',
  status: 'active',
  revision: '2026-08-14T12:00:00.000Z',
} as AuthUser;

//===================================================================

test('creates only valid discriminated auth states', () => {
  assert.deepEqual(createBootstrappingAuthState(), {
    status: 'bootstrapping',
    user: null,
    error: null,
  });

  assert.deepEqual(createAuthenticatedAuthState(user), {
    status: 'authenticated',
    user,
    error: null,
    isRevalidating: false,
  });

  assert.deepEqual(createUnavailableAuthState(new Error('offline'), user), {
    status: 'unavailable',
    user,
    error: new Error('offline'),
  });
});

//===================================================================

test('password changes and resets always produce unauthenticated state', () => {
  assert.deepEqual(createUnauthenticatedAuthState('password_changed'), {
    status: 'unauthenticated',
    user: null,
    error: null,
    reason: 'password_changed',
  });

  assert.deepEqual(createUnauthenticatedAuthState('password_reset'), {
    status: 'unauthenticated',
    user: null,
    error: null,
    reason: 'password_reset',
  });
});
