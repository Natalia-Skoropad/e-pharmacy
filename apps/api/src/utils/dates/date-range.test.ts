import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getEndOfDay,
  getStartOfDay,
  getEndOfBusinessDay,
  getStartOfBusinessDay,
} from './date-range';

//===============================================================

test('creates UTC day boundaries for validated calendar dates', () => {
  assert.equal(
    getStartOfDay('2026-07-22').toISOString(),
    '2026-07-22T00:00:00.000Z'
  );

  assert.equal(
    getEndOfDay('2026-07-22').toISOString(),
    '2026-07-22T23:59:59.999Z'
  );
});

//===============================================================

test('rejects malformed and non-existent calendar dates', () => {
  assert.throws(() => getStartOfDay('not-a-date'), RangeError);
  assert.throws(() => getEndOfDay('2026-02-29'), RangeError);
  assert.throws(() => getEndOfDay('2026-99-45'), RangeError);
});

//===============================================================

// Business-day filters match the Kyiv-local day used by the UI, including DST.
test('Kyiv calendar-day boundaries follow winter and summer offsets', () => {
  assert.equal(
    getStartOfBusinessDay('2026-01-12').toISOString(),
    '2026-01-11T22:00:00.000Z'
  );

  assert.equal(
    getEndOfBusinessDay('2026-01-12').toISOString(),
    '2026-01-12T21:59:59.999Z'
  );

  assert.equal(
    getStartOfBusinessDay('2026-07-12').toISOString(),
    '2026-07-11T21:00:00.000Z'
  );

  assert.equal(
    getEndOfBusinessDay('2026-07-12').toISOString(),
    '2026-07-12T20:59:59.999Z'
  );

  assert.equal(
    getStartOfBusinessDay('2026-03-29').toISOString(),
    '2026-03-28T22:00:00.000Z'
  );

  assert.equal(
    getEndOfBusinessDay('2026-03-29').toISOString(),
    '2026-03-29T20:59:59.999Z'
  );
});
