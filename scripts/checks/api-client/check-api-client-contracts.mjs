import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const packageRoot = path.join(repositoryRoot, 'packages/api-client');

const read = (relativePath) =>
  readFile(path.join(packageRoot, relativePath), 'utf8');

//===================================================================

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', 'dist', '.next', '.turbo'].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
    } else if (
      /\.(?:ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts')
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

const [
  jsonResponse,
  requestBody,
  requestExecutor,
  pagination,
  query,
  types,
  buildConfig,
  readme,
] = await Promise.all([
  read('src/transport/json-response.ts'),
  read('src/transport/request-body.ts'),
  read('src/transport/request-executor.ts'),
  read('src/response/pagination.ts'),
  read('src/transport/query-string.ts'),
  read('src/transport/types.ts'),
  read('tsconfig.build.json'),
  read('README.md'),
]);

assert.match(jsonResponse, /\\\+json/);
assert.match(requestExecutor, /responseType === 'no-content'/);
assert.doesNotMatch(types, /BodyInit\s*\|/);
assert.doesNotMatch(types, /next\?:/);
assert.doesNotMatch(types, /FormData|Blob|ReadableStream|ArrayBuffer/);
assert.match(requestBody, /INVALID_REQUEST_BODY/);
assert.match(requestBody, /custom toJSON/);
assert.match(pagination, /legacyItemKeys/);
assert.match(pagination, /legacyEmptyPage/);
assert.match(pagination, /normalizedLegacyEmptyPage/);
assert.match(pagination, /invalid-empty-page/);
assert.match(query, /Number\.isFinite/);
assert.match(query, /searchParams\.append/);
assert.match(buildConfig, /"emitDeclarationOnly": true/);
assert.match(buildConfig, /"rootDir": "src"/);
assert.match(readme, /generic type is not runtime validation/i);
assert.match(readme, /transport/i);
assert.match(readme, /endpoint DTO parser/i);
assert.match(readme, /totalPages": 0/);

//===================================================================

for (const testFile of [
  'src/transport/api-request.test.ts',
  'src/transport/api-error.test.ts',
  'src/transport/query-string.test.ts',
  'src/transport/request-body.test.ts',
  'src/response/api-envelope.test.ts',
  'src/response/shared-dto-parsers.test.ts',
  'src/response/pagination.test.ts',
  'test/integration/http-transport.test.ts',
]) {
  await access(path.join(packageRoot, testFile));
}

//===================================================================

const endpointBoundaryFiles = [
  ...(await collectTypeScriptFiles(
    path.join(repositoryRoot, 'apps/client/src/lib/api')
  )),

  ...(await collectTypeScriptFiles(
    path.join(repositoryRoot, 'apps/pharmacy/src/lib/api')
  )),

  path.join(repositoryRoot, 'apps/client/src/app/sitemap.ts'),
];

const endpointBoundarySource = (
  await Promise.all(endpointBoundaryFiles.map((file) => readFile(file, 'utf8')))
).join('\n');

for (const [pattern, message] of [
  [
    /localApiRequest\s*</,
    'localApiRequest generics are forbidden at the HTTP boundary.',
  ],
  [
    /publicBackendApiRequest\s*</,
    'publicBackendApiRequest generics are forbidden at the HTTP boundary.',
  ],
  [/apiRequest\s*</, 'apiRequest generics are forbidden at the HTTP boundary.'],
  [
    /getResponseData\s*\(/,
    'getResponseData must not be used at the HTTP boundary.',
  ],
  [
    /response\.json\(\)[^;\n]*\bas\b/,
    'response.json assertions are forbidden at the HTTP boundary.',
  ],
]) {
  assert.doesNotMatch(endpointBoundarySource, pattern, message);
}

console.log(
  'API-client contract check passed (transport, bodies, JSON, envelopes, endpoint DTOs, pagination, query and build policy).'
);
