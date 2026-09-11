import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  normalizeProductRequest,
  normalizeProductRequestDetails,
  normalizeProductRequestsResponse,
  normalizeProductRequestStatus,
} from './product-requests';

//===================================================================

const REQUEST_ID = '507f1f77bcf86cd799439011';
const PRODUCT_ID = '507f1f77bcf86cd799439012';

//===================================================================

function validRequest() {
  return {
    id: REQUEST_ID,
    createdAt: '2026-08-12T10:00:00.000Z',
    updatedAt: '2026-08-13T10:00:00.000Z',
    requestNumber: REQUEST_ID,
    productId: PRODUCT_ID,
    productArticle: 'ASP-100',
    productName: 'Aspirin',
    article: 'ASP-100',
    name: 'Aspirin',
    category: 'medicine',
    status: 'in_progress',

    history: [
      {
        id: `${REQUEST_ID}-0`,
        status: 'in_progress',
        title: 'Request is in progress',
        description: 'The request is being reviewed.',
        createdAt: '2026-08-12T10:00:00.000Z',
      },
    ],
    commentsTotal: 1,
  };
}

//===================================================================

function isInvalidResponse(error: unknown): boolean {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
}

//===================================================================

test('product request parser preserves the canonical application projection', () => {
  const row = normalizeProductRequest(validRequest());
  assert.equal(row?.id, REQUEST_ID);
  assert.equal(row?.productId, PRODUCT_ID);
  assert.equal(row?.status, 'in_progress');

  const details = normalizeProductRequestDetails(validRequest());
  assert.equal(details?.updatedAt, '2026-08-13T10:00:00.000Z');
  assert.equal(details?.history.length, 1);
  assert.equal(details?.commentsTotal, 1);
});

//===================================================================

test('legacy request statuses are normalized explicitly and unknown statuses are rejected', () => {
  assert.deepEqual(normalizeProductRequestStatus('in_work'), {
    success: true,
    value: 'in_progress',
    legacy: true,
  });

  assert.deepEqual(normalizeProductRequestStatus('on_moderation'), {
    success: true,
    value: 'in_progress',
    legacy: true,
  });

  assert.deepEqual(normalizeProductRequestStatus('unexpected'), {
    success: false,
    issue: 'unknown-status',
    value: 'unexpected',
  });
});

//===================================================================

test('product request pagination rejects malformed rows instead of silently dropping them', () => {
  const response = {
    items: [validRequest()],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-08-12',
  };

  assert.equal(normalizeProductRequestsResponse(response).items.length, 1);

  assert.throws(
    () =>
      normalizeProductRequestsResponse({
        ...response,
        items: [{ ...validRequest(), status: 'unexpected' }],
      }),
    isInvalidResponse
  );
});

//===================================================================

test('product request list metadata fails closed for malformed earliest dates', () => {
  const response = {
    items: [validRequest()],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-08-12',
  };

  for (const earliestCreatedAt of [undefined, '', '2026-99-99', 123]) {
    assert.throws(
      () =>
        normalizeProductRequestsResponse({
          ...response,
          earliestCreatedAt,
        }),
      isInvalidResponse
    );
  }

  assert.equal(
    normalizeProductRequestsResponse({
      ...response,
      items: [],
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }).earliestCreatedAt,
    null
  );
});
