import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { getProfileErrorMessage } from './get-profile-error-message';

//===================================================================

test('maps profile business codes without exposing backend copy', () => {
  const error = new ApiError('Telephone already exists internally.', {
    httpStatus: 409,
    backendCode: 'AUTH_PHONE_CONFLICT',
  });

  assert.equal(
    getProfileErrorMessage(error, 'Fallback'),
    'This phone number is already used by another account.'
  );
});


//===================================================================

test('maps moderation and owner-only profile codes through controlled copy', () => {
  assert.equal(
    getProfileErrorMessage(
      new ApiError('backend wording must not matter', {
        httpStatus: 409,
        backendCode: 'PHARMACY_PROFILE_ALREADY_SUBMITTED',
      }),
      'Fallback'
    ),
    'This pharmacy profile is already submitted for review.'
  );

  assert.equal(
    getProfileErrorMessage(
      new ApiError('backend wording must not matter', {
        httpStatus: 403,
        backendCode: 'PHARMACY_OWNER_REQUIRED',
      }),
      'Fallback'
    ),
    'Only the pharmacy owner can change verification profile data.'
  );
});

//===================================================================

test('does not expose unknown API or technical messages', () => {
  assert.equal(
    getProfileErrorMessage(
      new ApiError('MongoServerError: internal detail', {
        httpStatus: 500,
        backendCode: 'UNKNOWN_INTERNAL_CODE',
      }),
      'Could not save profile.'
    ),
    'The service is temporarily unavailable. Please try again later.'
  );

  assert.equal(
    getProfileErrorMessage(new Error('raw internal error'), 'Safe fallback'),
    'Safe fallback'
  );
});
