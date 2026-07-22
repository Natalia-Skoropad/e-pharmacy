import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../core/api-error';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from './pagination';

//===================================================================

const normalizeItem = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

//===================================================================

test('normalizes a valid pagination response', () => {
  const result = normalizePaginatedResponse(
    {
      items: [' first ', 'second'],
      page: 1,
      perPage: 20,
      total: 2,
      totalPages: 1,
    },
    { normalizeItem }
  );

  assert.deepEqual(result, {
    success: true,
    data: {
      items: ['first', 'second'],
      page: 1,
      perPage: 20,
      total: 2,
      totalPages: 1,
    },
    issues: [],
  });
});

//===================================================================

test('supports an explicit alternative items key', () => {
  const result = normalizePaginatedResponse(
    { clients: ['client'], page: 1, perPage: 1, total: 1, totalPages: 1 },
    { itemKeys: ['items', 'clients'], normalizeItem }
  );

  assert.equal(result.success, true);
});

//===================================================================

test('does not silently turn malformed payloads into an empty page', () => {
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

test('rejects invalid and inconsistent pagination metadata', () => {
  const invalidPerPageResult = normalizePaginatedResponse(
    { items: ['item'], page: 1, perPage: 1.5, total: 1, totalPages: 1 },
    { normalizeItem }
  );

  assert.equal(invalidPerPageResult.success, false);
  if (!invalidPerPageResult.success) {
    assert.ok(
      invalidPerPageResult.issues.some(
        (issue) => issue.code === 'invalid-per-page'
      )
    );
  }

  const inconsistentResult = normalizePaginatedResponse(
    { items: ['item'], page: 2, perPage: 1, total: 2, totalPages: 1 },
    { normalizeItem }
  );

  assert.equal(inconsistentResult.success, false);
  if (!inconsistentResult.success) {
    assert.ok(
      inconsistentResult.issues.some(
        (issue) => issue.code === 'inconsistent-total-pages'
      )
    );

    assert.ok(
      inconsistentResult.issues.some(
        (issue) => issue.code === 'page-out-of-range'
      )
    );
  }
});

//===================================================================

test('accepts APIs that expose one empty page for an empty result set', () => {
  const result = normalizePaginatedResponse(
    { items: [], page: 1, perPage: 20, total: 0, totalPages: 1 },
    { normalizeItem }
  );

  assert.equal(result.success, true);
});

//===================================================================

test('captures item normalizer exceptions and throws a controlled API error', () => {
  const result = normalizePaginatedResponse(
    { items: ['item'], page: 1, perPage: 20, total: 1, totalPages: 1 },
    {
      normalizeItem: () => {
        throw new Error('broken item');
      },
    }
  );

  assert.equal(result.success, false);

  assert.throws(
    () => requirePaginatedResponse(result, 'test response'),
    ApiError
  );
});
