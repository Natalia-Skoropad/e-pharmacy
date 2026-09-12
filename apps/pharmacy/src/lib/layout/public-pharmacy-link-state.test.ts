import assert from 'node:assert/strict';
import test from 'node:test';

import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';

import { getPublicPharmacyLinkState } from './public-pharmacy-link-state';

//===================================================================

const ACTIVE_PROFILE: CurrentPharmacySummary = {
  id: '507f1f77bcf86cd799439011',
  name: 'Care Pharmacy',
  status: 'active',
  membershipRole: 'owner',
};

//===================================================================

function withClientAppUrl<T>(callback: () => T): T {
  const previousUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL;
  process.env.NEXT_PUBLIC_CLIENT_APP_URL = 'https://client.example.com';

  try {
    return callback();
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CLIENT_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_CLIENT_APP_URL = previousUrl;
    }
  }
}

//===================================================================

test('distinguishes initial loading and profile failure states', () => {
  assert.deepEqual(
    getPublicPharmacyLinkState({
      profile: null,
      isLoading: true,
      error: null,
    }),
    {
      status: 'loading',
      label: 'Loading my pharmacy website...',
    }
  );

  assert.deepEqual(
    getPublicPharmacyLinkState({
      profile: null,
      isLoading: false,
      error: new Error('network'),
    }),
    {
      status: 'error',
      label: 'My pharmacy website is temporarily unavailable',
    }
  );
});

//===================================================================

test('allows active and on-moderation pharmacies through the canonical URL helper', () => {
  withClientAppUrl(() => {
    for (const status of ['active', 'on_moderation'] as const) {
      const state = getPublicPharmacyLinkState({
        profile: { ...ACTIVE_PROFILE, status },
        isLoading: false,
        error: null,
      });

      assert.equal(state.status, 'available');
      assert.equal(
        state.status === 'available' && state.href.includes('care-pharmacy-'),
        true
      );
    }
  });
});

//===================================================================

test('inactive pharmacy status is distinct from a missing profile', () => {
  const inactive = getPublicPharmacyLinkState({
    profile: { ...ACTIVE_PROFILE, status: 'blocked' },
    isLoading: false,
    error: null,
  });

  assert.equal(inactive.status, 'inactive');

  const missing = getPublicPharmacyLinkState({
    profile: null,
    isLoading: false,
    error: null,
  });

  assert.equal(missing.status, 'unavailable');
});

//===================================================================

test('cached profile remains usable during background loading or refresh error', () => {
  withClientAppUrl(() => {
    for (const input of [
      { isLoading: true, error: null },
      { isLoading: false, error: new Error('refresh') },
    ]) {
      assert.equal(
        getPublicPharmacyLinkState({
          profile: ACTIVE_PROFILE,
          ...input,
        }).status,
        'available'
      );
    }
  });
});
