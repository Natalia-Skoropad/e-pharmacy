import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidatePharmacyProfileRequest,
  isCurrentPharmacyProfileRequest,
} from './pharmacy-profile-request';

//===================================================================

test('stale pharmacy owner responses cannot overwrite a new account', () => {
  assert.equal(
    isCurrentPharmacyProfileRequest({
      currentIdentity: '507f1f77bcf86cd799439012',
      requestIdentity: '507f1f77bcf86cd799439011',
      currentVersion: 2,
      requestVersion: 1,
      aborted: false,
    }),
    false
  );
});

//===================================================================

test('only the current non-aborted pharmacy profile request may commit', () => {
  assert.equal(
    isCurrentPharmacyProfileRequest({
      currentIdentity: '507f1f77bcf86cd799439011',
      requestIdentity: '507f1f77bcf86cd799439011',
      currentVersion: 3,
      requestVersion: 3,
      aborted: false,
    }),
    true
  );

  assert.equal(
    isCurrentPharmacyProfileRequest({
      currentIdentity: '507f1f77bcf86cd799439011',
      requestIdentity: '507f1f77bcf86cd799439011',
      currentVersion: 3,
      requestVersion: 3,
      aborted: true,
    }),
    false
  );
});

//===================================================================

test('authoritative profile sync invalidates a pending older GET', () => {
  const controller = new AbortController();
  const pendingRequestVersion = 7;

  const currentVersion = invalidatePharmacyProfileRequest({
    currentVersion: pendingRequestVersion,
    controller,
  });

  assert.equal(currentVersion, 8);
  assert.equal(controller.signal.aborted, true);

  assert.equal(
    isCurrentPharmacyProfileRequest({
      currentIdentity: '507f1f77bcf86cd799439011',
      requestIdentity: '507f1f77bcf86cd799439011',
      currentVersion,
      requestVersion: pendingRequestVersion,
      aborted: controller.signal.aborted,
    }),
    false
  );
});

//===================================================================

test('a mutation sync makes an in-flight refresh response obsolete', () => {
  const refreshController = new AbortController();
  const refreshRequestVersion = 11;

  const versionAfterMutation = invalidatePharmacyProfileRequest({
    currentVersion: refreshRequestVersion,
    controller: refreshController,
  });

  assert.equal(
    isCurrentPharmacyProfileRequest({
      currentIdentity: '507f1f77bcf86cd799439011',
      requestIdentity: '507f1f77bcf86cd799439011',
      currentVersion: versionAfterMutation,
      requestVersion: refreshRequestVersion,
      aborted: false,
    }),
    false
  );
});
