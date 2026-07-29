import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../transport/api-error';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from './pagination';

//===================================================================

const normalizeItem = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

//===================================================================

test('normalizes the canonical pagination response and empty-page contract', () => {
  const result = normalizePaginatedResponse(
    {
      items: [],
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
    },
    { normalizeItem }
  );

  assert.deepEqual(result, {
    success: true,
    data: { items: [], page: 1, perPage: 20, total: 0, totalPages: 0 },
    issues: [],

    metadata: {
      sourceItemKey: 'items',
      usedLegacyItemKey: false,
      normalizedLegacyEmptyPage: false,
    },
  });
});

//===================================================================

test('rejects non-canonical empty pages unless explicit legacy normalization is enabled', () => {
  const legacyPayload = {
    items: [],
    page: 2,
    perPage: 20,
    total: 0,
    totalPages: 1,
  };

  assert.equal(
    normalizePaginatedResponse(legacyPayload, { normalizeItem }).success,
    false
  );

  const legacyResult = normalizePaginatedResponse(legacyPayload, {
    legacyEmptyPage: 'normalize-to-zero',
    normalizeItem,
  });

  assert.equal(legacyResult.success, true);
  if (legacyResult.success) {
    assert.equal(legacyResult.data.page, 1);
    assert.equal(legacyResult.data.totalPages, 0);
    assert.equal(legacyResult.metadata.normalizedLegacyEmptyPage, true);
  }

  const invalidCanonicalPage = normalizePaginatedResponse(
    { ...legacyPayload, totalPages: 0 },
    { normalizeItem }
  );

  assert.equal(invalidCanonicalPage.success, false);
  if (!invalidCanonicalPage.success) {
    assert.ok(
      invalidCanonicalPage.issues.some(
        (issue) => issue.code === 'invalid-empty-page'
      )
    );
  }
});

//===================================================================

test('supports only explicitly declared legacy item keys and reports their use', () => {
  const result = normalizePaginatedResponse(
    { clients: ['client'], page: 1, perPage: 1, total: 1, totalPages: 1 },
    { legacyItemKeys: ['clients'], normalizeItem }
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.metadata.sourceItemKey, 'clients');
    assert.equal(result.metadata.usedLegacyItemKey, true);
  }

  assert.equal(
    normalizePaginatedResponse(
      { clients: [], page: 1, perPage: 1, total: 0, totalPages: 0 },
      { normalizeItem }
    ).success,
    false
  );
});

//===================================================================

test('rejects duplicate item arrays and invalid alias configuration', () => {
  const duplicate = normalizePaginatedResponse(
    {
      items: ['canonical'],
      clients: ['legacy'],
      page: 1,
      perPage: 2,
      total: 1,
      totalPages: 1,
    },
    { legacyItemKeys: ['clients'], normalizeItem }
  );

  assert.equal(duplicate.success, false);
  if (!duplicate.success) {
    assert.ok(
      duplicate.issues.some((issue) => issue.code === 'duplicate-items-key')
    );
  }

  assert.throws(
    () =>
      normalizePaginatedResponse(
        { items: [], page: 1, perPage: 1, total: 0, totalPages: 0 },
        { legacyItemKeys: ['items'], normalizeItem }
      ),
    TypeError
  );
});

//===================================================================

test('does not silently turn malformed payloads or items into an empty page', () => {
  for (const payload of [
    null,
    [],
    { items: [] },
    { items: [null], page: 1, perPage: 20, total: 1, totalPages: 1 },
  ]) {
    const result = normalizePaginatedResponse(payload, { normalizeItem });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.issues.length > 0);
  }
});

//===================================================================

test('rejects unsafe integers, overflow and inconsistent pagination metadata', () => {
  for (const payload of [
    { items: [], page: 1, perPage: 1.5, total: 0, totalPages: 0 },

    {
      items: [],
      page: Number.MAX_SAFE_INTEGER + 1,
      perPage: 1,
      total: 0,
      totalPages: 0,
    },

    { items: ['a', 'b'], page: 1, perPage: 1, total: 2, totalPages: 2 },
    { items: ['a'], page: 2, perPage: 1, total: 1, totalPages: 1 },
  ]) {
    assert.equal(
      normalizePaginatedResponse(payload, { normalizeItem }).success,
      false
    );
  }
});

//===================================================================

test('captures normalizer exceptions and preserves request context in ApiError', () => {
  const result = normalizePaginatedResponse(
    { items: ['item'], page: 1, perPage: 20, total: 1, totalPages: 1 },
    {
      normalizeItem: () => {
        throw new Error('broken item');
      },
    }
  );

  assert.throws(
    () =>
      requirePaginatedResponse(result, {
        label: 'test response',
        url: '/api/items?page=1',
        method: 'GET',
        requestId: 'request-123',
      }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.transportCode === 'INVALID_RESPONSE' &&
      error.url === '/api/items?page=1' &&
      error.method === 'GET' &&
      error.requestId === 'request-123' &&
      Array.isArray((error.details as { issues?: unknown[] }).issues)
  );
});

//===================================================================

test('surfaces legacy normalization metadata to an optional reporter', () => {
  const result = normalizePaginatedResponse(
    { requests: [], page: 1, perPage: 10, total: 0, totalPages: 1 },
    {
      legacyItemKeys: ['requests'],
      legacyEmptyPage: 'normalize-to-zero',
      normalizeItem,
    }
  );

  let report: unknown;
  requirePaginatedResponse(result, {
    onLegacyContract: (metadata) => {
      report = metadata;
    },
  });

  assert.deepEqual(report, {
    sourceItemKey: 'requests',
    usedLegacyItemKey: true,
    normalizedLegacyEmptyPage: true,
  });
});
