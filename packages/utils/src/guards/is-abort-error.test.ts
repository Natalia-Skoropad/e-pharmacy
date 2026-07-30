import assert from 'node:assert/strict';
import test from 'node:test';

import { isAbortError } from './is-abort-error';

//===================================================================

test('recognizes DOM and transport abort errors', () => {
  assert.equal(
    isAbortError(new DOMException('Navigation changed', 'AbortError')),
    true
  );

  assert.equal(isAbortError({ transportCode: 'ABORTED' }), true);
  assert.equal(isAbortError(new Error('failed')), false);
});
