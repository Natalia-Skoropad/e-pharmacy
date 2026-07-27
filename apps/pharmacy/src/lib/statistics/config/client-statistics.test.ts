import assert from 'node:assert/strict';
import test from 'node:test';

import { CLIENT_STATISTICS_LABELS } from './client-statistics';

//===================================================================

test('keeps pharmacy client statistics app-local and fully labelled', () => {
  assert.deepEqual(Object.keys(CLIENT_STATISTICS_LABELS), [
    'total',
    'repeat',
    'active',
    'blocked',
  ]);

  for (const label of Object.values(CLIENT_STATISTICS_LABELS)) {
    assert.equal(label.trim().length > 0, true);
  }
});
