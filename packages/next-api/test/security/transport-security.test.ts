import assert from 'node:assert/strict';
import test from 'node:test';

import { assertLocalApiPath } from '../../src/browser/local-api-path.ts';
import { createAllowedAuthCookieHeader } from '../../src/internal/cookie-header.ts';
import { assertTrustedBackendPath } from '../../src/internal/trusted-backend-path.ts';

//===================================================================

test('browser transport cannot bypass the same-origin BFF', () => {
  assert.throws(() => assertLocalApiPath('https://backend.example/orders'));
  assert.doesNotThrow(() => assertLocalApiPath('/api/orders'));
});

//===================================================================

test('backend proxy cannot become an open proxy', () => {
  assert.throws(() => assertTrustedBackendPath('https://metadata.internal/'));
  assert.throws(() => assertTrustedBackendPath('//metadata.internal/'));
  assert.throws(() => assertTrustedBackendPath('/safe\\..\\secret'));
  assert.throws(() => assertTrustedBackendPath('/safe/%2e%2e/secret'));
  assert.throws(() => assertTrustedBackendPath('/safe\u0000secret'));
});

//===================================================================

test('unrelated browser cookies never reach the backend', () => {
  const header = createAllowedAuthCookieHeader(
    'analytics=1; locale=uk; e_pharmacy_access_token=access',
    'access-only'
  );

  assert.equal(header, 'e_pharmacy_access_token=access');
});
