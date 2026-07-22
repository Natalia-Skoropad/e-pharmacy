import assert from 'node:assert/strict';
import test from 'node:test';

import { countTrueConditions } from './count-true-conditions';

//===================================================================

test('counts boolean conditions', () => {
  assert.equal(countTrueConditions(), 0);
  assert.equal(countTrueConditions(true, false, true), 2);
});
