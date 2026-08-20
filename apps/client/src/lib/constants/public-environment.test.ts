import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isOptimizedProductionBuild,
  resolveClientPublicEnvironment,
  shouldRequireExplicitProductionSiteUrl,
} from './public-environment';

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

test('allows localhost when local production fallback is explicitly permitted', () => {
  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: undefined,
      nodeEnv: 'production',
      allowLocalProductionSiteUrl: true,
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
      allowLocalProductionSiteUrl: true,
    }),

    {
      ok: true,
      environment: { siteUrl: 'http://localhost:3000' },
    }
  );
});

//===================================================================

test('rejects a production localhost origin without the explicit local-build opt-in', () => {
  const result = resolveClientPublicEnvironment({
    configuredSiteUrl: 'http://localhost:3000',
    nodeEnv: 'production',
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'LOCAL_PRODUCTION_URL_NOT_ALLOWED');
});

//===================================================================

test('canonical production policy distinguishes build-time validation from production runtime', () => {
  assert.equal(isOptimizedProductionBuild('phase-production-build'), true);
  assert.equal(isOptimizedProductionBuild('phase-production-server'), false);
  assert.equal(isOptimizedProductionBuild(undefined), false);

  assert.equal(
    shouldRequireExplicitProductionSiteUrl({
      nodeEnv: 'production',
      nextPhase: 'phase-production-server',
      allowLocalProductionSiteUrl: undefined,
    }),
    true
  );

  assert.equal(
    shouldRequireExplicitProductionSiteUrl({
      nodeEnv: 'production',
      nextPhase: 'phase-production-build',
      allowLocalProductionSiteUrl: undefined,
    }),
    false
  );

  assert.equal(
    shouldRequireExplicitProductionSiteUrl({
      nodeEnv: 'production',
      nextPhase: 'phase-production-server',
      allowLocalProductionSiteUrl: 'true',
    }),
    false
  );

  assert.equal(
    shouldRequireExplicitProductionSiteUrl({
      nodeEnv: 'development',
      nextPhase: undefined,
      allowLocalProductionSiteUrl: undefined,
    }),
    false
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

//===================================================================

test('requires an explicit canonical site URL in production', () => {
  const result = resolveClientPublicEnvironment({
    configuredSiteUrl: undefined,
    nodeEnv: 'production',
    requireExplicitProductionSiteUrl: true,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'MISSING_PRODUCTION_SITE_URL');

  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: 'https://www.example.com',
      runtimeSiteUrl: 'https://preview.example.com',
      deploymentSiteUrl: 'preview-deployment.vercel.app',
      nodeEnv: 'production',
      requireExplicitProductionSiteUrl: true,
    }),
    {
      ok: true,
      environment: { siteUrl: 'https://www.example.com' },
    }
  );

  assert.deepEqual(
    resolveClientPublicEnvironment({
      configuredSiteUrl: undefined,
      deploymentSiteUrl: 'client-production.vercel.app',
      nodeEnv: 'production',
      requireExplicitProductionSiteUrl: true,
    }),
    {
      ok: true,
      environment: { siteUrl: 'https://client-production.vercel.app' },
    }
  );
});
