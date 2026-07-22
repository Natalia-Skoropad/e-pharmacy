import assert from 'node:assert/strict';
import test from 'node:test';

import { capitalizeFirst, getTrimmedString } from './string-values';

//===================================================================

test('returns a trimmed non-empty string', () => {
  assert.equal(getTrimmedString('  Name  '), 'Name');
  assert.equal(getTrimmedString('   '), undefined);
  assert.equal(getTrimmedString('Україна'), 'Україна');
  assert.equal(getTrimmedString(10), undefined);
});

//===================================================================

test('capitalizes only the first character', () => {
  assert.equal(capitalizeFirst('active'), 'Active');
  assert.equal(capitalizeFirst('in_progress'), 'In_progress');
  assert.equal(capitalizeFirst(''), '');
});
