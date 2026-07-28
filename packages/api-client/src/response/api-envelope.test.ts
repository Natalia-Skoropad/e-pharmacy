import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../core/api-error';
import { getApiErrorMessage } from '../core/get-api-error-message';

import {
  parseApiEmptySuccessEnvelope,
  parseApiNullableSuccessEnvelope,
  parseApiSuccessEnvelope,
} from './api-envelope';

//===================================================================

test('parses success envelopes and rejects HTTP-200 error envelopes', () => {
  assert.deepEqual(
    parseApiSuccessEnvelope({
      status: 'success',
      data: { items: [] },
      message: 'Loaded',
    }),
    {
      status: 'success',
      data: { items: [] },
      message: 'Loaded',
    }
  );

  assert.throws(
    () =>
      parseApiSuccessEnvelope({
        status: 'error',
        data: { items: [] },
      }),
    (error: unknown) =>
      error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
});

//===================================================================

test('requires the data field while preserving explicit nullable data', () => {
  assert.equal(
    parseApiNullableSuccessEnvelope({ status: 'success', data: null }).data,
    null
  );

  assert.throws(
    () => parseApiNullableSuccessEnvelope({ status: 'success' }),
    ApiError
  );
});

//===================================================================

test('parses empty JSON success separately from data envelopes', () => {
  assert.deepEqual(
    parseApiEmptySuccessEnvelope({
      status: 'success',
      message: 'Deleted',
    }),
    { status: 'success', message: 'Deleted' }
  );

  assert.throws(
    () =>
      parseApiEmptySuccessEnvelope({
        status: 'success',
        data: null,
      }),
    ApiError
  );
});

//===================================================================

test('legacy array messages include only non-empty strings', () => {
  assert.equal(
    getApiErrorMessage({
      message: ['First', null, { nested: true }, 42, '  ', 'Second'],
    }),
    'First, Second'
  );
});
