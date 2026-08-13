import assert from 'node:assert/strict';
import test from 'node:test';

import { isCurrentPharmacyProfileRequest } from './pharmacy-profile-request';

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
