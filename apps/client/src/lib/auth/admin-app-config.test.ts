import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_DASHBOARD_PATH,
  DEVELOPMENT_ADMIN_APP_URL,
  resolveAdminAppConfiguration,
} from './admin-app-config-core';

//===================================================================

const CLIENT_URL = 'https://client.example.com';

//===================================================================

test('uses the local admin origin only outside production', () => {
  const result = resolveAdminAppConfiguration({
    configuredUrl: undefined,
    nodeEnv: 'development',
    clientSiteUrl: 'http://localhost:3000',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(DEVELOPMENT_ADMIN_APP_URL, 'http://localhost:3001');
  assert.equal(ADMIN_DASHBOARD_PATH, '/admin/dashboard');

  assert.equal(
    result.config.dashboardUrl,
    'http://localhost:3001/admin/dashboard'
  );
});

//===================================================================

test('preserves a configured admin application base path', () => {
  const result = resolveAdminAppConfiguration({
    configuredUrl: 'https://apps.example.com/admin-app',
    nodeEnv: 'production',
    clientSiteUrl: CLIENT_URL,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(
    result.config.dashboardUrl,
    'https://apps.example.com/admin-app/admin/dashboard'
  );

  assert.equal(result.config.allowedPathPrefix, '/admin-app/admin');
});

//===================================================================

test('rejects unsafe or malformed production admin application URLs', () => {
  const cases = [
    { configuredUrl: undefined, expected: 'MISSING_URL' },
    {
      configuredUrl: 'http://admin.example.com',
      expected: 'INSECURE_PRODUCTION_URL',
    },
    {
      configuredUrl: 'javascript:alert(1)',
      expected: 'UNSUPPORTED_PROTOCOL',
    },
    {
      configuredUrl: 'https://user:secret@admin.example.com',
      expected: 'CREDENTIALS_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://admin.example.com?source=client',
      expected: 'QUERY_OR_HASH_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://admin.example.com#dashboard',
      expected: 'QUERY_OR_HASH_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://client.example.com/admin-app',
      expected: 'SAME_ORIGIN_NOT_ALLOWED',
    },
    {
      configuredUrl: 'https://admin.example.com/admin/dashboard',
      expected: 'DASHBOARD_URL_INSTEAD_OF_BASE_URL',
    },
  ] as const;

  for (const testCase of cases) {
    const result = resolveAdminAppConfiguration({
      configuredUrl: testCase.configuredUrl,
      nodeEnv: 'production',
      clientSiteUrl: CLIENT_URL,
    });

    assert.equal(result.ok, false);
    if (result.ok) continue;
    assert.equal(result.code, testCase.expected);
  }
});
