import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../transport/api-error';
import { parseApiEmptyResponse, parseApiResponseData } from './api-response';

import {
  parseActiveSessionsResponse,
  parseFavoriteMutationResponse,
  parseHealthResponse,
  parseProductsResponse,
} from './shared-dto-parsers';

//===================================================================

test('parses an endpoint DTO only after validating the success envelope', () => {
  assert.deepEqual(
    parseApiResponseData(
      { status: 'success', data: { status: 'ok' } },
      parseHealthResponse,
      { url: '/health', method: 'GET' }
    ),
    { status: 'ok' }
  );

  assert.throws(
    () =>
      parseApiResponseData(
        { status: 'error', data: { status: 'ok' } },
        parseHealthResponse,
        { url: '/health', method: 'GET' }
      ),
    (error: unknown) =>
      error instanceof ApiError &&
      error.transportCode === 'INVALID_RESPONSE' &&
      error.url === '/health'
  );
});

//===================================================================

test('rejects invalid endpoint DTO fields instead of trusting a generic type', () => {
  assert.throws(
    () =>
      parseApiResponseData(
        {
          status: 'success',
          data: { isFavorite: 'yes', message: 'Updated' },
        },
        parseFavoriteMutationResponse
      ),
    (error: unknown) =>
      error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
});

//===================================================================

test('validates shared pagination response contracts', () => {
  assert.deepEqual(
    parseProductsResponse({
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }),

    {
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }
  );

  assert.throws(
    () =>
      parseProductsResponse({
        items: [],
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 1,
        earliestCreatedAt: null,
      }),
    ApiError
  );
});

//===================================================================

test('distinguishes empty success envelopes from data envelopes', () => {
  assert.equal(
    parseApiEmptyResponse({ status: 'success', message: 'Done' }),
    undefined
  );

  assert.throws(
    () => parseApiEmptyResponse({ status: 'success', data: null }),
    ApiError
  );
});

//===================================================================

test('validates active sessions at runtime', () => {
  assert.deepEqual(parseActiveSessionsResponse({ sessions: [] }), {
    sessions: [],
  });

  assert.throws(
    () => parseActiveSessionsResponse({ sessions: 'invalid' }),
    ApiError
  );
});
