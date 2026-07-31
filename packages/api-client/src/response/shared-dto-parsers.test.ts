import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../transport/api-error';
import { parseApiEmptyResponse, parseApiResponseData } from './api-response';

import {
  parseActiveSessionsResponse,
  parseFavoriteMutationResponse,
  parseHealthResponse,
  parsePharmacyDetailsResponse,
  parseProductDetails,
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

//===================================================================

test('requires backend-provided typed public slug IDs', () => {
  const product = {
    id: '6a5f5242d9c46211621ad70a',
    name: 'Amlodipine 5 mg Acme',
    publicSlugId: 'amlodipine-5-mg-acme-pr6a5f5242d9c46211621ad70a',
    article: 'AML-5',
    category: 'prescription',
    status: 'active',
    price: 100,
    foundInPharmaciesCount: 1,
    availableInPharmaciesCount: 1,
    inStock: true,
    rating: 5,
    reviewsCount: 1,
    isFavorite: false,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
    offers: [],
  };

  assert.equal(parseProductDetails(product).publicSlugId, product.publicSlugId);

  assert.throws(
    () => parseProductDetails({ ...product, publicSlugId: undefined }),
    ApiError
  );

  const pharmacy = {
    id: '6a5f5244a3defb1d037f06e7',
    name: 'Pharmacy Care Pharmacy Lviv',
    publicSlugId: 'pharmacy-care-pharmacy-lviv-ph6a5f5244a3defb1d037f06e7',
    rating: 5,
    availableProductsCount: 10,
    reviewsCount: 2,
    isFavorite: false,
    bankTransferAvailable: true,
    updatedAt: '2026-07-31T00:00:00.000Z',
  };

  assert.equal(
    parsePharmacyDetailsResponse({ pharmacy }).pharmacy.publicSlugId,
    pharmacy.publicSlugId
  );
});
