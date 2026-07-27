import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('exposes only a read-only browser auth-session hint policy', async () => {
  const [publicApi, storage, core] = await Promise.all([
    readFile(new URL('./index.ts', import.meta.url), 'utf8'),
    readFile(
      new URL(
        './server-managed-browser-auth-session-hint-storage.ts',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(new URL('../core/AuthProviderCore.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(publicApi, /server-managed-browser-auth-session-hint-storage/);
  assert.doesNotMatch(
    publicApi,
    /setBrowserAuthSessionHint|clearBrowserAuthSessionHint|browserAuthSessionHintStorage/
  );

  assert.match(storage, /hasHint:\s*hasBrowserAuthSessionHint/);
  assert.doesNotMatch(storage, /setHint|clearHint/);
  assert.doesNotMatch(core, /\.setHint\(|\.clearHint\(/);
});
