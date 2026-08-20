import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { NEXT_API_TIMEOUTS_MS } from './transport-policy.ts';

//===================================================================

test('document transfer timeout is explicitly separated from generic auth/private requests', () => {
  assert.equal(NEXT_API_TIMEOUTS_MS.authRequest, 20_000);
  assert.equal(NEXT_API_TIMEOUTS_MS.privateRequest, 12_000);
  assert.equal(NEXT_API_TIMEOUTS_MS.documentTransfer, 30_000);

  assert.ok(
    NEXT_API_TIMEOUTS_MS.documentTransfer > NEXT_API_TIMEOUTS_MS.authRequest
  );

  assert.ok(
    NEXT_API_TIMEOUTS_MS.documentTransfer > NEXT_API_TIMEOUTS_MS.privateRequest
  );
});

//===================================================================

test('document upload and private download proxies use the document transfer timeout', async () => {
  const [authProxySource, privateProxySource] = await Promise.all([
    readFile(new URL('../proxy/auth-proxy.ts', import.meta.url), 'utf8'),
    readFile(new URL('../proxy/backend-proxy.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(
    authProxySource,
    /bodyPreset === 'documentUpload'[\s\S]*NEXT_API_TIMEOUTS_MS\.documentTransfer/
  );

  assert.match(
    privateProxySource,
    /bodyPreset === 'documentUpload'[\s\S]*NEXT_API_TIMEOUTS_MS\.documentTransfer/
  );

  assert.match(
    privateProxySource,
    /proxyPrivateBackendDownloadRequest[\s\S]*timeoutMs:\s*NEXT_API_TIMEOUTS_MS\.documentTransfer/
  );
});
