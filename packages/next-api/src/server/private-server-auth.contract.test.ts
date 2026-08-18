import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('authenticated server reads forward only access identity and remain fail-closed/no-store', async () => {
  const source = await readFile(
    new URL('./public-backend-api-request.ts', import.meta.url),
    'utf8'
  );

  const handler = source.slice(
    source.indexOf('export async function authenticatedBackendApiRequest')
  );

  assert.match(handler, /getRequestHeaders\(\)/);
  assert.match(handler, /createAllowedAuthCookieHeader\([\s\S]*?'access-only'/);
  assert.match(handler, /requestHeaders\.delete\('Cookie'\)/);
  assert.match(handler, /cache:\s*'no-store'/);
  assert.match(handler, /authMode:\s*'private'/);
  assert.match(handler, /throw error/);
  assert.doesNotMatch(handler, /refresh-only|REFRESH_TOKEN_COOKIE/);
});
