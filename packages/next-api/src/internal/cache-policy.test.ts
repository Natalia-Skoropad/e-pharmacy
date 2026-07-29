import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPublicCacheControl,
  resolvePublicRevalidate,
  validateCacheSeconds,
} from './cache-policy.ts';

//===================================================================

test('builds explicit public cache policies and supports no-store', () => {
  assert.equal(resolvePublicRevalidate(undefined), 120);
  assert.equal(resolvePublicRevalidate(false), false);
  assert.equal(createPublicCacheControl(false), 'no-store');
  assert.equal(createPublicCacheControl(0), 'no-store');

  assert.equal(
    createPublicCacheControl(120, 300),
    'public, s-maxage=120, stale-while-revalidate=300'
  );
  
  assert.equal(createPublicCacheControl(600, 0), 'public, s-maxage=600');
});

//===================================================================

test('rejects non-finite, fractional, negative, and excessive cache values', () => {
  for (const value of [Number.NaN, Infinity, -1, 1.5, 86_401]) {
    assert.throws(() => validateCacheSeconds(value, 'Cache value'));
  }
});
