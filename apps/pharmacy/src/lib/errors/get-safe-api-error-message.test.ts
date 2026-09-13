import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { getSafeApiErrorMessage } from './get-safe-api-error-message';

//===================================================================

test('does not expose raw backend or browser error messages', () => {
  assert.equal(
    getSafeApiErrorMessage(
      new ApiError('MongoServerError: secret internal detail', {
        httpStatus: 500,
      }),
      'Safe fallback.'
    ),

    'The service is temporarily unavailable. Please try again later.'
  );

  assert.equal(
    getSafeApiErrorMessage(new Error('raw browser error'), 'Safe fallback.'),
    'Safe fallback.'
  );
});

//===================================================================

test('maps transport failures through controlled copy', () => {
  const cases: Array<{
    error: ApiError;
    expected: string;
  }> = [
    {
      error: new ApiError('socket details', {
        transportCode: 'NETWORK_ERROR',
      }),
      expected: 'Network error. Check your connection and try again.',
    },
    {
      error: new ApiError('timeout details', { transportCode: 'TIMEOUT' }),
      expected: 'The request took too long. Please try again.',
    },
    {
      error: new ApiError('invalid payload details', {
        transportCode: 'INVALID_RESPONSE',
      }),
      expected:
        'The server returned an invalid response. Please try again later.',
    },
  ];

  for (const { error, expected } of cases) {
    assert.equal(getSafeApiErrorMessage(error, 'Fallback'), expected);
  }

  assert.equal(
    getSafeApiErrorMessage(
      new ApiError('aborted request detail', { transportCode: 'ABORTED' }),
      'Fallback'
    ),
    ''
  );
});

//===================================================================

test('maps common HTTP failures without surfacing backend messages', () => {
  const cases: Array<[number, string]> = [
    [400, 'Some submitted data is invalid. Review it and try again.'],
    [401, 'Your session has expired. Sign in again.'],
    [403, 'You do not have access to this action.'],
    [404, 'The requested resource is no longer available.'],
    [
      409,
      'The request conflicts with the current data. Refresh and try again.',
    ],
    [422, 'Some submitted data is invalid. Review it and try again.'],
    [503, 'The service is temporarily unavailable. Please try again later.'],
  ];

  for (const [httpStatus, expected] of cases) {
    assert.equal(
      getSafeApiErrorMessage(
        new ApiError('internal backend wording', { httpStatus }),
        'Fallback'
      ),
      expected
    );
  }
});

//===================================================================

test('prefers controlled backend-code copy over generic status copy', () => {
  assert.equal(
    getSafeApiErrorMessage(
      new ApiError('backend wording must not matter', {
        httpStatus: 409,
        backendCode: 'PRODUCT_MANAGEMENT_ALREADY_ADDED',
      }),
      'Fallback',
      {
        backendMessages: {
          PRODUCT_MANAGEMENT_ALREADY_ADDED:
            'This product is already added to your pharmacy.',
        },
      }
    ),
    'This product is already added to your pharmacy.'
  );
});
