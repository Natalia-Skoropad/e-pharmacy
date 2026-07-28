import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, isApiError } from './api-error';
import { getApiErrorMessage } from './get-api-error-message';

//===================================================================

test('preserves transport, HTTP, backend and request diagnostic fields', () => {
  const cause = new TypeError('socket closed');
  const error = new ApiError('Request failed', {
    transportCode: 'INVALID_RESPONSE',
    httpStatus: 502,
    backendCode: 'UPSTREAM_INVALID',
    requestId: 'request-123',
    details: { field: 'items' },
    url: '/api/items',
    method: 'GET',
    cause,
  });

  assert.equal(error.transportCode, 'INVALID_RESPONSE');
  assert.equal(error.httpStatus, 502);
  assert.equal(error.backendCode, 'UPSTREAM_INVALID');
  assert.equal(error.requestId, 'request-123');
  assert.deepEqual(error.details, { field: 'items' });
  assert.equal(error.url, '/api/items');
  assert.equal(error.method, 'GET');
  assert.equal(error.cause, cause);
  assert.equal(isApiError(error), true);
});

//===================================================================

test('does not accept permissive status-shaped objects as ApiError', () => {
  assert.equal(
    isApiError({ name: 'ApiError', message: 'fake', status: 502 }),
    false
  );
});

//===================================================================

test('safe message extraction ignores objects, numbers and blank strings', () => {
  assert.equal(
    getApiErrorMessage({
      message: ['Useful', {}, 42, '', '  ', 'Second'],
    }),
    'Useful, Second'
  );
});
