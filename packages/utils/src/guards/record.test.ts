import assert from 'node:assert/strict';
import test from 'node:test';

import { isRecord } from './record';

//===================================================================

test('accepts dictionary-like records only', () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord(Object.create(null)), true);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord(new Date()), false);
  assert.equal(isRecord(new Number(3)), false);
  assert.equal(isRecord(null), false);
  assert.equal(isRecord('value'), false);

  assert.equal(
    isRecord(() => undefined),
    false
  );
});
