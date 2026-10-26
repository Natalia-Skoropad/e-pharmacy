import assert from 'node:assert/strict';
import test from 'node:test';

import { getEndOfDay, getStartOfDay } from './date-range';

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
