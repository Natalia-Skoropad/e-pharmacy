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

//===================================================================

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', 'dist', '.turbo', '.next'].includes(entry.name))
      continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath)));
    else if (/\.(?:ts|tsx|mjs)$/.test(entry.name)) files.push(absolutePath);
  }

  return files;
}

//===================================================================

const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, 'package.json'), 'utf8')
);

//===================================================================

assert.deepEqual(packageJson.exports, {
  './contracts': './src/contracts/index.ts',
  './transport': './src/transport/index.ts',
  './response': './src/response/index.ts',
});

//===================================================================

for (const entrypoint of ['contracts', 'transport', 'response']) {
  const source = await readFile(
    path.join(packageRoot, `src/${entrypoint}/index.ts`),
    'utf8'
  );

  assert.equal(
    /export\s+\*/.test(source),
    false,
    `${entrypoint} entrypoint must use an explicit export allowlist.`
  );
}

//===================================================================

const forbiddenPublicSymbols = [
  'createApiUrl',
  'getResponseData',
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
  'backendRoutes',
  'localAuthApiRoutes',
];

//===================================================================

const publicBarrels = (
  await Promise.all(
    ['contracts', 'transport', 'response'].map((entrypoint) =>
      readFile(path.join(packageRoot, `src/${entrypoint}/index.ts`), 'utf8')
    )
  )
).join('\n');

for (const symbol of forbiddenPublicSymbols) {
  assert.equal(
    new RegExp(`\\b${symbol}\\b`).test(publicBarrels),
    false,
    `${symbol} must not be part of the stable public API.`
  );
}

const consumerFiles = [
  ...(await collectFiles(path.join(repositoryRoot, 'apps'))),
  ...(await collectFiles(path.join(repositoryRoot, 'packages'))),
  ...(await collectFiles(path.join(repositoryRoot, 'scripts'))),
];

const forbiddenImports = [];

for (const file of consumerFiles) {
  if (file.startsWith(packageRoot)) continue;
  const source = await readFile(file, 'utf8');
  if (
    /from\s+['"]@e-pharmacy\/api-client['"]/.test(source) ||
    /@e-pharmacy\/api-client\/src/.test(source) ||
    /@e-pharmacy\/api-client\/core/.test(source)
  ) {
    forbiddenImports.push(path.relative(repositoryRoot, file));
  }
}

assert.deepEqual(
  forbiddenImports,
  [],
  `Root/deep/legacy core imports are forbidden:\n${forbiddenImports.join('\n')}`
);

for (const testFile of [
  'src/transport/api-request.test.ts',
  'src/transport/request-body.test.ts',
  'src/transport/query-string.test.ts',
  'src/response/api-envelope.test.ts',
  'src/response/shared-dto-parsers.test.ts',
  'src/response/pagination.test.ts',
  'test/integration/http-transport.test.ts',
]) {
  await access(path.join(packageRoot, testFile));
}

await access(
  path.join(
    repositoryRoot,
    'packages/next-api/test/integration/api-client-bff-transport.test.ts'
  )
);

console.log(
  `API-client public API check passed (${consumerFiles.length} repository source files scanned, 3 approved entrypoints).`
);
