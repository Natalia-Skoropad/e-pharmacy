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

//===================================================================

test('redacts private client search query values', () => {
  const result = redactRequestPath(
    '/api/clients?name=Natalia&contact=user@example.com&phone=%2B380501234567&address=Main%20Street&clientId=507f1f77bcf86cd799439011&page=2'
  );

  assert.match(result, /name=%5BREDACTED%5D/);
  assert.match(result, /contact=%5BREDACTED%5D/);
  assert.match(result, /phone=%5BREDACTED%5D/);
  assert.match(result, /address=%5BREDACTED%5D/);
  assert.match(result, /clientId=%5BREDACTED%5D/);
  assert.match(result, /page=2/);

  assert.doesNotMatch(
    result,
    /Natalia|user%40example\.com|380501234567|Main(?:%20|\+)Street|507f1f77bcf86cd799439011/
  );
});

//===================================================================

test('does not redact ordinary name queries outside private clients', () => {
  const result = redactRequestPath('/products?name=Aspirin&page=2');

  assert.match(result, /name=Aspirin/);
  assert.match(result, /page=2/);
});
