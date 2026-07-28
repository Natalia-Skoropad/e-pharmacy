import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const sourceRoot = path.join(repositoryRoot, 'packages/api-client/src');

const barrels = (
  await Promise.all(
    ['contracts/index.ts', 'core/index.ts', 'response/index.ts'].map((file) =>
      readFile(path.join(sourceRoot, file), 'utf8')
    )
  )
).join('\n');

const removedOrInternalCandidates = [
  'API_HEADERS',
  'storefrontRoutes',
  'createApiUrl',
  'getNullableResponseData',
  'assertSuccessfulEmptyResponse',
  'isNativeRequestBody',
  'ApiRequestBody',
  'NextRequestOptions',
  'ApiRetryConfig',
  'DEFAULT_API_REQUEST_TIMEOUT_MS',
  'DEFAULT_RETRY_DELAY_MS',
  'DEFAULT_RETRYABLE_GET_STATUSES',
  'NormalizePaginationOptions',
  'PaginationNormalizationIssue',
  'PaginationNormalizationIssueCode',
  'PaginationNormalizationResult',
  'RequirePaginationContext',
];

for (const symbol of removedOrInternalCandidates) {
  assert.equal(
    new RegExp(`\\b${symbol}\\b`).test(barrels),
    false,
    `${symbol} is internal/dead and must not be exported.`
  );
}

const deletedFiles = [
  'contracts/local-api-routes.ts',
  'contracts/storefront-routes.ts',
  'core/build-query-string.ts',
  'core/parse-json-safe.ts',
  'index.ts',
];

for (const relativePath of deletedFiles) {
  try {
    await readFile(path.join(sourceRoot, relativePath), 'utf8');
    assert.fail(`${relativePath} must remain deleted.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

console.log(
  `API-client unused-export check passed (${removedOrInternalCandidates.length} internal/dead candidates guarded).`
);
