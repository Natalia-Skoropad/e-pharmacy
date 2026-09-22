import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveApiBaseUrl, resolveNodeEnvironment } from './api-base-url.ts';

//===================================================================

test('production API base URL configuration fails closed', () => {
  assert.throws(
    () => resolveApiBaseUrl(undefined, 'production'),
    /required in production/
  );

  assert.throws(
    () => resolveApiBaseUrl('http://api.example.com', 'production'),
    /must use https in production/
  );

  assert.throws(
    () => resolveApiBaseUrl('http://localhost:4000', 'production'),
    /must use https in production/
  );

  assert.throws(
    () => resolveApiBaseUrl('not-an-absolute-url', 'production'),
    /must be a valid absolute URL/
  );

  assert.throws(
    () =>
      resolveApiBaseUrl(
        'https://username:password@api.example.com',
        'production'
      ),
    /must not contain credentials/
  );

  assert.throws(
    () => resolveApiBaseUrl('https://api.example.com?debug=1', 'production'),
    /must not contain credentials, query, or hash/
  );

  assert.equal(
    resolveApiBaseUrl('https://api.example.com/', 'production'),
    'https://api.example.com/'
  );
});

//===================================================================

test('local production-build validation can explicitly allow loopback HTTP only', () => {
  for (const apiBaseUrl of [
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://[::1]:4000',
  ]) {
    assert.equal(
      resolveApiBaseUrl(apiBaseUrl, 'production', {
        allowInsecureLoopbackInProduction: true,
      }),
      `${apiBaseUrl}/`
    );
  }

  assert.throws(
    () =>
      resolveApiBaseUrl('http://api.example.com', 'production', {
        allowInsecureLoopbackInProduction: true,
      }),
    /must use https in production/
  );
});

//===================================================================

test('development API base URL falls back to localhost when omitted', () => {
  assert.equal(
    resolveApiBaseUrl(undefined, 'development'),
    'http://localhost:4000/'
  );
});

//===================================================================

test('node environment resolution is shared by config and runtime callers', () => {
  assert.equal(resolveNodeEnvironment(undefined), 'development');
  assert.equal(resolveNodeEnvironment('test'), 'test');
  assert.equal(resolveNodeEnvironment('production'), 'production');

  assert.throws(
    () => resolveNodeEnvironment('preview'),
    /NODE_ENV must be development, test, or production/
  );
});
