import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveClientAppConfiguration } from './client-app-config';

//===================================================================

test('client app configuration is fail-closed in production', () => {
  const cases = [
    { configuredUrl: undefined, expected: 'MISSING_URL' },
    { configuredUrl: 'not a url', expected: 'INVALID_URL' },
    {
      configuredUrl: 'http://client.example.com',
      expected: 'INSECURE_PRODUCTION_URL',
    },
    {
      configuredUrl: 'https://user:secret@client.example.com',
      expected: 'CREDENTIALS_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://client.example.com?source=bad',
      expected: 'QUERY_OR_HASH_NOT_ALLOWED',
    },
  ] as const;

  for (const testCase of cases) {
    const result = resolveClientAppConfiguration({
      configuredUrl: testCase.configuredUrl,
      nodeEnv: 'production',
    });

    assert.equal(result.ok, false);
    if (result.ok) continue;
    assert.equal(result.code, testCase.expected);
  }
});

//===================================================================

test('client app configuration preserves a configured base path', () => {
  const result = resolveClientAppConfiguration({
    configuredUrl: 'https://apps.example.com/client-app',
    nodeEnv: 'production',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.config.origin, 'https://apps.example.com');
  assert.equal(result.config.basePath, '/client-app');
  assert.equal(result.config.baseUrl, 'https://apps.example.com/client-app/');
});

//===================================================================

test('local client app fallback is available only outside production', () => {
  const result = resolveClientAppConfiguration({
    configuredUrl: undefined,
    nodeEnv: 'development',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.config.baseUrl, 'http://localhost:3000/');
});
