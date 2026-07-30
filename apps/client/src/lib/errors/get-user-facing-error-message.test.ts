import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { getUserFacingErrorMessage } from './get-user-facing-error-message';

//===================================================================

test('maps transport failures without exposing raw backend copy', () => {
  assert.equal(
    getUserFacingErrorMessage(
      new ApiError('socket detail', { transportCode: 'NETWORK_ERROR' })
    ),

    'Cannot connect to the server. Please check that the API is running.'
  );

  assert.equal(
    getUserFacingErrorMessage(
      new ApiError('internal backend detail', { httpStatus: 500 })
    ),

    'Server error. Please try again later.'
  );
});

//===================================================================

test('uses backend semantic codes only through an explicit allowlist', () => {
  const error = new ApiError('raw message', {
    httpStatus: 409,
    backendCode: 'PHONE_EXISTS',
  });

  assert.equal(
    getUserFacingErrorMessage(error, {
      backendCodeMessages: {
        PHONE_EXISTS: 'This phone number is already used.',
      },
    }),

    'This phone number is already used.'
  );
});

test('returns an empty message for aborted requests', () => {
  assert.equal(
    getUserFacingErrorMessage(
      new ApiError('aborted', { transportCode: 'ABORTED' })
    ),
    ''
  );
});
