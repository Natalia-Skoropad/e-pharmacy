import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

//===================================================================

const read = (path) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

//===================================================================

const publicProxy = read('packages/next-api/src/proxy/public-backend-proxy.ts');

const backendResponse = read(
  'packages/next-api/src/internal/backend-response.ts'
);

const transportError = read(
  'packages/next-api/src/internal/transport-error.ts'
);

const apiError = read('packages/api-client/src/transport/api-error.ts');

//===================================================================

test('invalid upstream photo content type uses the existing invalid backend response error', () => {
  assert.match(
    publicProxy,
    /import\s*\{[^}]*\bInvalidBackendResponseError\b[^}]*\}\s*from\s*['"]\.\.\/internal\/backend-response['"]/s
  );

  assert.match(
    publicProxy,
    /responseType === 'image' && execution\.response\.ok/
  );

  assert.match(
    publicProxy,
    /throw new InvalidBackendResponseError\('Invalid public image response\.'\)/
  );

  assert.doesNotMatch(
    publicProxy,
    /transportCode:\s*'INVALID_BACKEND_RESPONSE'/
  );

  assert.match(
    backendResponse,
    /export class InvalidBackendResponseError extends Error/
  );
});

//===================================================================

test('invalid image responses preserve the existing 502 BFF error contract', () => {
  assert.match(
    transportError,
    /error instanceof InvalidBackendResponseError[\s\S]*?status:\s*502,[\s\S]*?code:\s*'INVALID_BACKEND_RESPONSE'/
  );

  assert.match(apiError, /\| 'INVALID_RESPONSE'/);
  assert.doesNotMatch(apiError, /\| 'INVALID_BACKEND_RESPONSE'/);
});
