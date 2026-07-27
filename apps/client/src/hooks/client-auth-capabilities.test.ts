import assert from 'node:assert/strict';
import test from 'node:test';

import { selectClientAuthCapabilities } from './client-auth-capabilities';

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
    user: { ...CLIENT_USER, role: 'pharmacy' },
    status: 'authenticated',
    isAuthenticated: true,
    isBootstrapping: false,
    isUnavailable: false,
  });

  assert.equal(activePharmacy.isActivePharmacyUser, true);
  assert.equal(activePharmacy.canOpenPharmacyCabinet, true);
  assert.equal(activePharmacy.canUseClientFeatures, false);

  const blockedClient = selectClientAuthCapabilities({
    user: { ...CLIENT_USER, status: 'blocked' },
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
