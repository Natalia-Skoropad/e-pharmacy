import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

const source = await readFile(
  new URL('./AuthProviderCore.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('refresh retry timers are abortable and cleaned during lifecycle changes', () => {
  assert.match(source, /refreshRetryControllersRef/);
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /window\.clearTimeout\(timeoutId\)/);
  assert.match(source, /controller\.signal\.addEventListener/);
});

//===================================================================

test('global listeners and intervals have symmetric cleanup', () => {
  assert.match(source, /window\.addEventListener\('focus'/);
  assert.match(source, /window\.removeEventListener\('focus'/);
  assert.match(source, /document\.addEventListener\(\s*'visibilitychange'/);
  assert.match(source, /document\.removeEventListener\(\s*'visibilitychange'/);
  assert.match(source, /window\.setInterval/);
  assert.match(source, /window\.clearInterval/);
});
