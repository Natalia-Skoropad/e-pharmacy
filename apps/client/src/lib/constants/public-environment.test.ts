import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveClientPublicEnvironment } from './public-environment';

//===================================================================

test('normalizes an origin-only site URL', () => {
  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: 'https://example.com/',
      nodeEnv: 'production',
    }),

    {
      ok: true,
      environment: { siteUrl: 'https://example.com' },
    }
  );
});

//===================================================================

test('rejects unsafe and base-path site URLs', () => {
  const cases = [
    ['http://example.com', 'INSECURE_PRODUCTION_URL'],
    ['https://user:pass@example.com', 'CREDENTIALS_NOT_ALLOWED'],
    ['https://example.com?from=test', 'QUERY_OR_HASH_NOT_ALLOWED'],
    ['https://example.com/client-app', 'BASE_PATH_NOT_ALLOWED'],
  ] as const;

  for (const [configuredSiteUrl, code] of cases) {
    const result = resolveClientPublicEnvironment({
      configuredSiteUrl,
      nodeEnv: 'production',
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, code);
  }
});

//===================================================================

test('allows localhost during an optimized local build', () => {
  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: undefined,
      nodeEnv: 'production',
    }),
    {
      ok: true,
      environment: { siteUrl: 'http://localhost:3000' },
    }
  );

  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: 'http://localhost:3000',
      nodeEnv: 'production',
    }),
    {
      ok: true,
      environment: { siteUrl: 'http://localhost:3000' },
    }
  );
});

//===================================================================

test('uses the browser or deployment origin when the explicit URL is absent', () => {
  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: undefined,
      runtimeSiteUrl: 'https://preview.example.com',
      deploymentSiteUrl: 'ignored.example.com',
      nodeEnv: 'production',
    }),
    {
      ok: true,
      environment: { siteUrl: 'https://preview.example.com' },
    }
  );

  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: undefined,
      deploymentSiteUrl: 'client-production.vercel.app',
      nodeEnv: 'production',
    }),
    {
      ok: true,
      environment: { siteUrl: 'https://client-production.vercel.app' },
    }
  );
});
