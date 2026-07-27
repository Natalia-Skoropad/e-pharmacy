import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const source = await readFile(
  new URL('./AuthProviderCore.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('provider delegates token refresh to the BFF and has no periodic refresh owner', () => {
  assert.doesNotMatch(source, /refreshSession/);
  assert.doesNotMatch(source, /setInterval/);
  assert.match(source, /getCurrentUser\(\{ signal \}\)/);
});

//===================================================================

test('provider uses lifecycle-scoped abortable request attempts', () => {
  assert.match(source, /new AuthRequestManager\(\)/);
  assert.match(source, /advanceLifecycle\(\)/);
  assert.match(source, /manager\.cancel\(attempt\)/);
  assert.doesNotMatch(source, /WeakMap/);
});

//===================================================================

test('bootstrap policy is explicit and no silent no-hint default remains', () => {
  assert.match(source, /bootstrapMode === 'session-hint'/);
  assert.doesNotMatch(source, /noopSessionHintStorage/);
});
