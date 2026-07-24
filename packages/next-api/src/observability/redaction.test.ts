import assert from 'node:assert/strict';
import test from 'node:test';

import { redactRequestPath } from './redaction.ts';

//===================================================================

test('redacts sensitive query values case-insensitively', () => {
  const result = redactRequestPath(
    '/password-reset?EMAIL=user@example.com&access_token=secret&Page=2'
  );

  assert.match(result, /EMAIL=%5BREDACTED%5D/);
  assert.match(result, /access_token=%5BREDACTED%5D/);
  assert.match(result, /Page=2/);
  assert.doesNotMatch(result, /user%40example\.com|secret/);
});
