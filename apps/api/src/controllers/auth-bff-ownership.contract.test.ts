import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const readSource = async (relativePath: string) =>
  readFile(resolve(__dirname, relativePath), 'utf8');

//===================================================================

test('token-bearing auth endpoints require the trusted BFF in every environment', async () => {
  const [controllerSource, envSource] = await Promise.all([
    readSource('./auth.controller.ts'),
    readSource('../config/env.ts'),
  ]);

  assert.match(
    envSource,
    /BFF_PROXY_SECRET:\s*getRequiredEnv\(['"]BFF_PROXY_SECRET['"]\)\.trim\(\)/
  );

  assert.doesNotMatch(
    controllerSource,
    /return\s+env\.NODE_ENV\s*!==\s*['"]production['"]/,
    'development/test must not trust an auth proxy marker without the secret'
  );

  assert.doesNotMatch(controllerSource, /setAuthCookies|clearAuthCookies/);

  const guardedCalls = controllerSource.match(
    /assertNextAuthProxyRequest\(req\);/g
  );
  assert.ok((guardedCalls?.length ?? 0) >= 3);
});

//===================================================================

test('a browser-supplied marker alone cannot satisfy the BFF trust check', async () => {
  const controllerSource = await readSource('./auth.controller.ts');

  assert.match(
    controllerSource,
    /marker\s*!==\s*BFF_AUTH_PROXY_MARKER_VALUE[\s\S]*typeof secret === ['"]string['"] && secret === configuredSecret/
  );
});
