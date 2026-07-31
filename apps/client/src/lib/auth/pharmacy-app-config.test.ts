import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePharmacyAppConfiguration } from './pharmacy-app-config-core';

//===================================================================

const CLIENT_URL = 'https://client.example.com';

//===================================================================

test('preserves a configured pharmacy application base path', () => {
  const result = resolvePharmacyAppConfiguration({
    configuredUrl: 'https://apps.example.com/pharmacy-app',
    nodeEnv: 'production',
    clientSiteUrl: CLIENT_URL,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(
    result.config.dashboardUrl,
    'https://apps.example.com/pharmacy-app/pharmacy/dashboard'
  );

  assert.equal(result.config.allowedPathPrefix, '/pharmacy-app/pharmacy');
});

//===================================================================

test('rejects missing, insecure, credentialed and same-origin production URLs', () => {
  const cases = [
    {
      configuredUrl: undefined,
      expected: 'MISSING_URL',
    },
    {
      configuredUrl: 'http://pharmacy.example.com',
      expected: 'INSECURE_PRODUCTION_URL',
    },
    {
      configuredUrl: 'https://user:secret@pharmacy.example.com',
      expected: 'CREDENTIALS_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://client.example.com/pharmacy-app',
      expected: 'SAME_ORIGIN_NOT_ALLOWED',
    },
  ] as const;

  for (const testCase of cases) {
    const result = resolvePharmacyAppConfiguration({
      configuredUrl: testCase.configuredUrl,
      nodeEnv: 'production',
      clientSiteUrl: CLIENT_URL,
    });

    assert.equal(result.ok, false);
    if (result.ok) continue;
    assert.equal(result.code, testCase.expected);
  }
});

//===================================================================

test('uses the local pharmacy origin only outside production', () => {
  const result = resolvePharmacyAppConfiguration({
    configuredUrl: undefined,
    nodeEnv: 'development',
    clientSiteUrl: 'http://localhost:3000',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(
    result.config.dashboardUrl,
    'http://localhost:3002/pharmacy/dashboard'
  );
});
