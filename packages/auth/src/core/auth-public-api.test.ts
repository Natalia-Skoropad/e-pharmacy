import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import * as errorsApi from '../errors';
import * as routingApi from '../routing';
import * as resetPasswordApi from '../reset-password';

//===================================================================

const require = createRequire(import.meta.url);

const packageJson = require('../../package.json') as {
  exports: Record<string, string>;
};

//===================================================================

test('package exposes only explicit React, Next, errors, routing, and reset-password entrypoints', () => {
  assert.deepEqual(Object.keys(packageJson.exports).sort(), [
    './errors',
    './next',
    './react',
    './reset-password',
    './routing',
  ]);

  assert.deepEqual(packageJson.exports, {
    './react': './src/react.ts',
    './next': './src/next.ts',
    './errors': './src/errors/index.ts',
    './routing': './src/routing/index.ts',
    './reset-password': './src/reset-password.ts',
  });
});

//===================================================================

test('errors entrypoint exposes its stable runtime helper', () => {
  assert.deepEqual(Object.keys(errorsApi), ['getAuthErrorCode']);
  assert.equal(typeof errorsApi.getAuthErrorCode, 'function');
});

//===================================================================

test('routing entrypoint exposes only safe redirect helpers', () => {
  assert.deepEqual(Object.keys(routingApi).sort(), [
    'getSafeApplicationRedirectPath',
    'getSafeLocalRedirectPath',
    'getTrustedExternalRedirectUrl',
  ]);

  for (const helper of Object.values(routingApi)) {
    assert.equal(typeof helper, 'function');
  }
});

//===================================================================

test('reset-password entrypoint exposes only token lifecycle helpers', () => {
  assert.deepEqual(Object.keys(resetPasswordApi).sort(), [
    'captureResetPasswordToken',
    'clearResetPasswordTokenFromHistoryState',
  ]);

  for (const helper of Object.values(resetPasswordApi)) {
    assert.equal(typeof helper, 'function');
  }
});
