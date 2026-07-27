import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS,
  CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES,
} from './client-filter-contracts';

//===================================================================

test('keeps successful-order filter values unique and fully labelled', () => {
  assert.deepEqual(CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES, [
    'repeat',
    'successful',
    'other',
  ]);

  assert.equal(
    new Set(CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES).size,
    CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES.length
  );

  assert.deepEqual(
    Object.keys(CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS).sort(),
    [...CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES].sort()
  );
});
