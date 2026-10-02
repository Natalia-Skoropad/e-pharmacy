import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { selectPublicAuthActionsState } from './public-auth-actions-state';

//===================================================================

const logout = async () => undefined;
const retryAuthBootstrap = async () => null;

//===================================================================

const BASE_USER = {
  id: '507f1f77bcf86cd799439011',
  name: 'Client User',
  email: 'client@example.com',
  phone: '+380501112233',
  revision: '2026-08-14T12:00:00.000Z' as AuthUser['revision'],
} as const;

const CLIENT_USER = {
  ...BASE_USER,
  role: 'client',
  status: 'active',
} satisfies AuthUser;

const PHARMACY_USER = {
  ...BASE_USER,
  role: 'pharmacy',
  status: 'active',
} satisfies AuthUser;

const NEW_PHARMACY_USER = {
  ...BASE_USER,
  role: 'pharmacy',
  status: 'new',
} satisfies AuthUser;

const ADMIN_USER = {
  ...BASE_USER,
  role: 'admin',
  status: 'active',
} satisfies AuthUser;

const BLOCKED_CLIENT_USER = {
  ...BASE_USER,
  role: 'client',
  status: 'blocked',
} satisfies AuthUser;

//===================================================================

test('uses one explicit mode for loading, unavailable, and guest states', () => {
  assert.equal(
    selectPublicAuthActionsState({
      user: null,
      status: 'bootstrapping',
      logout,
      retryAuthBootstrap,
    }).mode,
    'loading'
  );

  const unavailable = selectPublicAuthActionsState({
    user: null,
    status: 'unavailable',
    logout,
    retryAuthBootstrap,
  });

  assert.equal(unavailable.mode, 'unavailable');
  assert.equal(unavailable.retryAuthBootstrap, retryAuthBootstrap);
  assert.equal('logout' in unavailable, false);

  assert.equal(
    selectPublicAuthActionsState({
      user: null,
      status: 'unauthenticated',
      logout,
      retryAuthBootstrap,
    }).mode,
    'guest'
  );
});

//===================================================================

test('maps authenticated users to role-specific presentation modes', () => {
  assert.equal(
    selectPublicAuthActionsState({
      user: CLIENT_USER,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-client'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: PHARMACY_USER,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-pharmacy'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: NEW_PHARMACY_USER,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-pharmacy'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: ADMIN_USER,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-admin'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: BLOCKED_CLIENT_USER,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'blocked-account'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: {
        ...BASE_USER,
        role: 'future-role',
        status: 'active',
      } as unknown as AuthUser,
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-unsupported'
  );
});

//===================================================================

test('does not expose contradictory guest and unavailable flags', () => {
  const state = selectPublicAuthActionsState({
    user: null,
    status: 'unavailable',
    logout,
    retryAuthBootstrap,
  });

  assert.equal(state.mode, 'unavailable');
  assert.equal('logout' in state, false);
  assert.equal('shouldShowGuestActions' in state, false);
  assert.equal('shouldShowAuthenticatedActions' in state, false);
  assert.equal('isAuthenticated' in state, false);

  const guest = selectPublicAuthActionsState({
    user: null,
    status: 'unauthenticated',
    logout,
    retryAuthBootstrap,
  });

  assert.equal('logout' in guest, false);
  assert.equal('retryAuthBootstrap' in guest, false);
});
