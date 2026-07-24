import assert from 'node:assert/strict';
import test from 'node:test';

import { assertLocalApiPath } from './local-api-path.ts';

//===================================================================

test('accepts same-origin /api paths', () => {
  assert.doesNotThrow(() => assertLocalApiPath('/api/products?page=1'));
});

//===================================================================

test('rejects external and protocol-relative URLs', () => {
  assert.throws(() => assertLocalApiPath('https://example.com/api/products'));
  assert.throws(() => assertLocalApiPath('//example.com/api/products'));
});

//===================================================================

test('rejects non-api same-origin paths', () => {
  assert.throws(() => assertLocalApiPath('/products'));
});
