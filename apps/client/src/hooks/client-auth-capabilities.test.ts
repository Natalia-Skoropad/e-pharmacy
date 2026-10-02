import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { selectClientAuthCapabilities } from './client-auth-capabilities';

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

const ACTIVE_PHARMACY_USER = {
  ...BASE_USER,
  role: 'pharmacy',
  status: 'active',
} satisfies AuthUser;

const NEW_PHARMACY_USER = {
  ...BASE_USER,
  role: 'pharmacy',
  status: 'new',
} satisfies AuthUser;

const BLOCKED_CLIENT_USER = {
  ...BASE_USER,
  role: 'client',
  status: 'blocked',
} satisfies AuthUser;

const ACTIVE_ADMIN_USER = {
  ...BASE_USER,
  role: 'admin',
  status: 'active',
} satisfies AuthUser;

//===================================================================

test('exposes a minimal client-specific projection instead of the full auth context', () => {
  const capabilities = selectClientAuthCapabilities({
    user: CLIENT_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.deepEqual(capabilities, {
    user: CLIENT_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
    isActiveClient: true,
    isActivePharmacyUser: false,
    isActiveAdminUser: false,
    canUseClientFeatures: true,
    canOpenPharmacyCabinet: false,
  });

  assert.equal('login' in capabilities, false);
  assert.equal('logout' in capabilities, false);
  assert.equal('retryAuthBootstrap' in capabilities, false);
});

//===================================================================

test('distinguishes active pharmacy users from blocked and unauthenticated users', () => {
  const activePharmacy = selectClientAuthCapabilities({
    user: ACTIVE_PHARMACY_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(activePharmacy.isActivePharmacyUser, true);
  assert.equal(activePharmacy.canOpenPharmacyCabinet, true);
  assert.equal(activePharmacy.canUseClientFeatures, false);

  const newPharmacy = selectClientAuthCapabilities({
    user: NEW_PHARMACY_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(newPharmacy.isActivePharmacyUser, false);
  assert.equal(newPharmacy.canOpenPharmacyCabinet, true);
  assert.equal(newPharmacy.canUseClientFeatures, false);

  const blockedClient = selectClientAuthCapabilities({
    user: BLOCKED_CLIENT_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(blockedClient.isActiveClient, false);
  assert.equal(blockedClient.canUseClientFeatures, false);

  const guest = selectClientAuthCapabilities({
    user: null,
    status: 'unauthenticated',
    isAuthenticated: false,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(guest.canUseClientFeatures, false);
  assert.equal(guest.canOpenPharmacyCabinet, false);
});

//===================================================================

test('treats active admin users as privileged viewers without enabling client features', () => {
  const activeAdmin = selectClientAuthCapabilities({
    user: ACTIVE_ADMIN_USER,
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(activeAdmin.isActiveAdminUser, true);
  assert.equal(activeAdmin.canUseClientFeatures, false);
  assert.equal(activeAdmin.canOpenPharmacyCabinet, false);
});
