import assert from 'node:assert/strict';
import test from 'node:test';

import { createUniqueLabeledOptions } from './create-unique-labeled-options';

//===================================================================

test('creates sorted unique labeled options', () => {
  assert.deepEqual(
    createUniqueLabeledOptions(
      ['b', 'a', 'b'] as const,
      (value) => ({ a: 'Alpha', b: 'Beta' })[value]
    ),

    [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]
  );
});
