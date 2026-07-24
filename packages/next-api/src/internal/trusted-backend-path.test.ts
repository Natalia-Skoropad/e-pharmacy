import assert from 'node:assert/strict';
import test from 'node:test';

import { assertTrustedBackendPath } from './trusted-backend-path.ts';

//===================================================================

test('accepts a relative backend path', () => {
  assert.doesNotThrow(() => assertTrustedBackendPath('/products?page=1'));
});

//===================================================================

test('rejects absolute and protocol-relative backend URLs', () => {
  assert.throws(() => assertTrustedBackendPath('https://example.com/products'));
  assert.throws(() => assertTrustedBackendPath('//example.com/products'));
});

//===================================================================

test('rejects encoded and plain traversal', () => {
  assert.throws(() => assertTrustedBackendPath('/products/../admin'));
  assert.throws(() => assertTrustedBackendPath('/products/%2e%2e/admin'));
  assert.throws(() => assertTrustedBackendPath('/products\\admin'));
});
