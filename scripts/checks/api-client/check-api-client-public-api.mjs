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

assert.deepEqual(packageJson.exports, {
  './contracts': './src/contracts/index.ts',
  './core': './src/core/index.ts',
  './response': './src/response/index.ts',
});

for (const entrypoint of ['contracts', 'core', 'response']) {
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

const forbiddenPublicSymbols = [
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
  'backendRoutes',
  'localAuthApiRoutes',
];

const publicBarrels = (
  await Promise.all(
    ['contracts', 'core', 'response'].map((entrypoint) =>
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

const rootOrDeepImports = [];

for (const file of consumerFiles) {
  if (file.startsWith(packageRoot)) continue;
  const source = await readFile(file, 'utf8');
  if (
    /from\s+['"]@e-pharmacy\/api-client['"]/.test(source) ||
    /@e-pharmacy\/api-client\/src/.test(source)
  ) {
    rootOrDeepImports.push(path.relative(repositoryRoot, file));
  }
}

assert.deepEqual(
  rootOrDeepImports,
  [],
  `Root/deep API-client imports are forbidden:\n${rootOrDeepImports.join('\n')}`
);

const behavioralTestFiles = [
  'src/core/api-request.test.ts',
  'src/core/request-body.test.ts',
  'src/core/query-string.test.ts',
  'src/response/api-envelope.test.ts',
  'src/response/pagination.test.ts',
  'test/integration/http-transport.test.ts',
];

const behavioralTestSource = (
  await Promise.all(
    behavioralTestFiles.map(async (testFile) => {
      await access(path.join(packageRoot, testFile));
      return readFile(path.join(packageRoot, testFile), 'utf8');
    })
  )
).join('\n');

for (const transportSymbol of ['apiRequest', 'createApiClient']) {
  assert.match(
    behavioralTestSource,
    new RegExp(`\\b${transportSymbol}\\b`),
    `${transportSymbol} must have behavioral coverage.`
  );
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
