import assert from 'node:assert/strict';
import test from 'node:test';

import { selectPublicAuthActionsState } from './public-auth-actions-state';

//===================================================================

const logout = async () => undefined;
const retryAuthBootstrap = async () => null;

//===================================================================

const CLIENT_USER = {
  id: '507f1f77bcf86cd799439011',
  name: 'Client User',
  email: 'client@example.com',
  phone: '+380501112233',
  role: 'client',
  status: 'active',
} as const;

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
      user: { ...CLIENT_USER, role: 'pharmacy' },
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-pharmacy'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: { ...CLIENT_USER, role: 'admin' },
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'authenticated-admin'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: { ...CLIENT_USER, status: 'blocked' },
      status: 'authenticated',
      logout,
      retryAuthBootstrap,
    }).mode,

    'blocked-account'
  );

  assert.equal(
    selectPublicAuthActionsState({
      user: { ...CLIENT_USER, role: 'future-role' as never },
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
