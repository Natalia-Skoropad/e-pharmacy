import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('SSR public reads reuse the shared next-api transient retry policy without 429 retry', async () => {
  const [cacheOptions, serverTransport, transportPolicy] = await Promise.all([
    readFile(new URL('./cache-options.ts', import.meta.url), 'utf8'),

    readFile(
      new URL(
        '../../../../../../packages/next-api/src/server/public-backend-api-request.ts',
        import.meta.url
      ),
      'utf8'
    ),

    readFile(
      new URL(
        '../../../../../../packages/next-api/src/internal/transport-policy.ts',
        import.meta.url
      ),
      'utf8'
    ),
  ]);

  assert.match(cacheOptions, /PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS/);
  assert.doesNotMatch(cacheOptions, /\b429\b/);

  assert.match(
    serverTransport,
    /PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS[\s\S]*PUBLIC_READ_RETRY_POLICY/
  );

  assert.match(
    transportPolicy,
    /PUBLIC_READ_RETRY_POLICY[\s\S]*attempts:\s*2[\s\S]*statuses:\s*\[502, 503, 504\][\s\S]*delayMs:\s*150/
  );
});
