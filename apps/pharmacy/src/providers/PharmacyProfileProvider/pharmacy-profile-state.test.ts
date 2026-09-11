import assert from 'node:assert/strict';
import test from 'node:test';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import {
  createPharmacyProfileRefreshErrorSnapshot,
  createPharmacyProfileRefreshStartSnapshot,
  type PharmacyProfileSnapshot,
} from './pharmacy-profile-state';

//===================================================================

const IDENTITY = '507f1f77bcf86cd799439011';

const PROFILE = {
  id: '507f1f77bcf86cd799439021',
  updatedAt: '2026-09-10T10:00:00.000Z',
} as MyPharmacyProfile;

//===================================================================

test('background refresh keeps the last known good pharmacy profile visible', () => {
  const loadedSnapshot: PharmacyProfileSnapshot = {
    identity: IDENTITY,
    profile: PROFILE,
    isLoading: false,
    error: null,
  };

  const refreshingSnapshot = createPharmacyProfileRefreshStartSnapshot(
    loadedSnapshot,
    IDENTITY
  );

  assert.equal(refreshingSnapshot.profile, PROFILE);
  assert.equal(refreshingSnapshot.isLoading, false);
  assert.equal(refreshingSnapshot.error, null);
});

//===================================================================

test('refresh transport error preserves the existing profile and exposes the error', () => {
  const error = new Error('Service unavailable');

  const loadedSnapshot: PharmacyProfileSnapshot = {
    identity: IDENTITY,
    profile: PROFILE,
    isLoading: false,
    error: null,
  };

  const failedSnapshot = createPharmacyProfileRefreshErrorSnapshot(
    loadedSnapshot,
    IDENTITY,
    error
  );

  assert.equal(failedSnapshot.profile, PROFILE);
  assert.equal(failedSnapshot.isLoading, false);
  assert.equal(failedSnapshot.error, error);
});

//===================================================================

test('initial profile retry without cached data remains an initial loading state', () => {
  const refreshingSnapshot = createPharmacyProfileRefreshStartSnapshot(
    null,
    IDENTITY
  );

  assert.equal(refreshingSnapshot.profile, null);
  assert.equal(refreshingSnapshot.isLoading, true);
  assert.equal(refreshingSnapshot.error, null);
});

//===================================================================

test('initial profile load error does not invent cached profile data', () => {
  const error = new Error('Service unavailable');

  const failedSnapshot = createPharmacyProfileRefreshErrorSnapshot(
    null,
    IDENTITY,
    error
  );

  assert.equal(failedSnapshot.profile, null);
  assert.equal(failedSnapshot.isLoading, false);
  assert.equal(failedSnapshot.error, error);
});
