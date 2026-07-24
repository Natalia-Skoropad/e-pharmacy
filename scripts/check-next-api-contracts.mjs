import { readFile } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const violations = [];

//===================================================================

const frontendBff = await read(
  'packages/next-api/src/internal/bff-contract.ts'
);

const backendBff = await read('apps/api/src/constants/bff.ts');
const frontendCookies = await read('packages/config/src/auth/auth-cookies.ts');
const backendCookies = await read('apps/api/src/constants/auth.ts');
const backendEnv = await read('apps/api/src/config/env.ts');
const nextApiEnv = await read('packages/next-api/src/internal/env.ts');

const nextApiSources = [
  await read('packages/next-api/src/internal/transport-error.ts'),
  await read('packages/next-api/src/proxy/auth-proxy.ts'),
  await read('packages/next-api/src/proxy/backend-proxy.ts'),
].join('\n');

//===================================================================

function extractString(source, name) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*['\"]([^'\"]+)['\"]`));
  return match?.[1];
}

//===================================================================

const stringPairs = [
  ['BFF_AUTH_PROXY_MARKER_VALUE', 'BFF_AUTH_PROXY_MARKER_VALUE'],
  ['BFF_AUTH_PROXY_HEADER_NAME', 'BFF_AUTH_PROXY_HEADER_NAME'],
  ['BFF_PROXY_SECRET_HEADER_NAME', 'BFF_PROXY_SECRET_HEADER_NAME'],
  ['REQUEST_ID_HEADER_NAME', 'REQUEST_ID_HEADER_NAME'],
];

//===================================================================

for (const [frontendName, backendName] of stringPairs) {
  const frontendValue = extractString(frontendBff, frontendName)?.toLowerCase();
  const backendValue = extractString(backendBff, backendName)?.toLowerCase();

  if (!frontendValue || frontendValue !== backendValue) {
    violations.push(`${frontendName} differs between BFF and backend`);
  }
}

//===================================================================

for (const name of [
  'ACCESS_TOKEN_COOKIE_NAME',
  'REFRESH_TOKEN_COOKIE_NAME',
  'LEGACY_AUTH_COOKIE_NAME',
]) {
  const backendName =
    name === 'LEGACY_AUTH_COOKIE_NAME' ? 'AUTH_COOKIE_NAME' : name;
  if (
    extractString(frontendCookies, name) !==
    extractString(backendCookies, backendName)
  ) {
    violations.push(`${name} differs between frontend and backend`);
  }
}

//===================================================================

if (
  !/NODE_ENV === 'production'[\s\S]*getRequiredEnv\('BFF_PROXY_SECRET'\)/.test(
    backendEnv
  )
) {
  violations.push('Backend does not require BFF_PROXY_SECRET in production');
}

if (!/nodeEnv === 'production'[\s\S]*!bffProxySecret/.test(nextApiEnv)) {
  violations.push('Next BFF does not require BFF_PROXY_SECRET in production');
}

if (/success\s*:\s*false/.test(nextApiSources)) {
  violations.push(
    'next-api still emits the legacy { success: false } error envelope'
  );
}

if (!/status:\s*'error'/.test(nextApiSources)) {
  violations.push(
    'next-api transport errors do not use the canonical error envelope'
  );
}

if (!/INVALID_BACKEND_RESPONSE/.test(nextApiSources)) {
  violations.push('Invalid auth/backend response classification is missing');
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

//===================================================================

console.log(
  'Next API contract parity check passed (headers, cookies, production secret, errors).'
);
