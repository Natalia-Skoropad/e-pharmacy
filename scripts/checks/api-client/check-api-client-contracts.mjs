import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
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

const [jsonResponse, requestBody, requestExecutor, pagination, query, types, buildConfig, readme] =
  await Promise.all([
    read('src/core/json-response.ts'),
    read('src/core/request-body.ts'),
    read('src/core/request-executor.ts'),
    read('src/response/pagination.ts'),
    read('src/core/query-string.ts'),
    read('src/core/types.ts'),
    read('tsconfig.build.json'),
    read('README.md'),
  ]);

assert.match(jsonResponse, /\\\+json/);
assert.match(requestExecutor, /responseType === 'no-content'/);
assert.doesNotMatch(types, /BodyInit\s*\|/);
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
assert.match(readme, /totalPages": 0/);

for (const testFile of [
  'src/core/api-request.test.ts',
  'src/core/api-error.test.ts',
  'src/core/query-string.test.ts',
  'src/core/request-body.test.ts',
  'src/response/api-envelope.test.ts',
  'src/response/pagination.test.ts',
  'test/integration/http-transport.test.ts',
]) {
  await access(path.join(packageRoot, testFile));
}

console.log('API-client contract check passed (transport, bodies, JSON, envelopes, pagination, query and build policy).');
