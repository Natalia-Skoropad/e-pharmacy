import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const readSource = async (relativePath: string) =>
  readFile(path.resolve(__dirname, relativePath), 'utf8');

//===================================================================

test('token-bearing auth endpoints require the trusted BFF before rate limiting and validation', async () => {
  const [controllerSource, middlewareSource, routesSource, envSource] =
    await Promise.all([
      readSource('./auth.controller.ts'),
      readSource('../middlewares/auth-bff.middleware.ts'),
      readSource('../routes/auth.routes.ts'),
      readSource('../config/env.ts'),
    ]);

  assert.match(
    envSource,
    /BFF_PROXY_SECRET:\s*getRequiredEnv\(['"]BFF_PROXY_SECRET['"]\)\.trim\(\)/
  );

  assert.doesNotMatch(
    middlewareSource,
    /return\s+env\.NODE_ENV\s*!==\s*['"]production['"]/,
    'development/test must not trust an auth proxy marker without the secret'
  );

  assert.doesNotMatch(controllerSource, /setAuthCookies|clearAuthCookies/);
  assert.doesNotMatch(controllerSource, /assertNextAuthProxyRequest/);

  assert.match(
    routesSource,
    /['"]\/register['"][\s\S]*?requireTrustedAuthProxy[\s\S]*?registrationIpRateLimit[\s\S]*?validateAuth[\s\S]*?registrationAccountRateLimit/
  );

  assert.match(
    routesSource,
    /['"]\/login['"][\s\S]*?requireTrustedAuthProxy[\s\S]*?loginIpRateLimit[\s\S]*?validateAuth[\s\S]*?loginProgressiveDelay[\s\S]*?loginAccountIpRateLimit/
  );

  assert.match(
    routesSource,
    /['"]\/refresh['"][\s\S]*?requireTrustedAuthProxy[\s\S]*?ctrlWrapper\(refreshAuthSession\)/
  );
});

//===================================================================

test('a browser-supplied marker alone cannot satisfy the BFF trust check', async () => {
  const middlewareSource = await readSource(
    '../middlewares/auth-bff.middleware.ts'
  );

  assert.match(
    middlewareSource,
    /marker\s*!==\s*BFF_AUTH_PROXY_MARKER_VALUE[\s\S]*typeof secret === ['"]string['"] && secret === configuredSecret/
  );
});
