import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const featureRoots = [
  'apps/pharmacy/src/components/all-products',
  'apps/pharmacy/src/components/products',
  'apps/pharmacy/src/components/product-requests',
].map((relativePath) => path.join(root, relativePath));

const ignored = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'coverage',
]);

//===================================================================

async function listFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(target)));
      continue;
    }

    if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

function isTestFile(file) {
  return /\.(?:test|react\.test|integration\.test)\.(?:ts|tsx)$/.test(file);
}

//===================================================================

function isTableOrDrawer(relativePath) {
  return /(?:Table|FiltersDrawer)\/[^/]+\.tsx$/.test(relativePath);
}

//===================================================================

function readNumericProperty(source, propertyName) {
  const match = source.match(
    new RegExp(`${propertyName}:\\s*([0-9+*() /_-]+?)(?:,|\\n)`)
  );

  assert.ok(match?.[1], `Could not read numeric contract ${propertyName}`);
  const expression = match[1].replaceAll('_', '').trim();

  assert.match(
    expression,
    /^[0-9+*() /-]+$/,
    `Unsafe numeric expression for ${propertyName}`
  );

  return Function(`"use strict"; return (${expression});`)();
}

//===================================================================

function getBase64Length(byteLength) {
  return 4 * Math.ceil(byteLength / 3);
}

//===================================================================

const files = (await Promise.all(featureRoots.map(listFiles))).flat();
const violations = [];

for (const file of files) {
  if (isTestFile(file)) continue;

  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (
    /from\s+['"](?:@e-pharmacy\/next-api\/server|@\/lib\/api\/server|[^'"]*apps\/api)/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: feature components must not import backend/server modules`
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(
      `${relative}: feature components must use pharmacy browser API adapters instead of direct fetch`
    );
  }

  if (
    /\b(?:Authorization|accessToken|refreshToken)\b|document\.cookie|\blocalStorage\b/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: feature components must not own auth token/cookie state`
    );
  }

  if (
    /https?:\/\/(?:localhost|127\.0\.0\.1)|NEXT_PUBLIC_[A-Z0-9_]*API|BACKEND_URL/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: feature components must not embed backend URLs`
    );
  }

  if (/\b(?:getMyPharmacyProfile|getCurrentPharmacyProfile)\b/.test(source)) {
    violations.push(
      `${relative}: product features must not fetch the full pharmacy profile directly`
    );
  }

  if (/\b(?:type|interface)\s+[A-Za-z0-9_]*Dto\b/.test(source)) {
    violations.push(
      `${relative}: canonical DTO types must remain in shared/domain layers`
    );
  }

  if (/\bconst\s+(?:PRODUCT|PRODUCT_REQUEST)_STATUSES\b/.test(source)) {
    violations.push(
      `${relative}: product/request status vocabularies must not be redefined in feature components`
    );
  }

  if (
    isTableOrDrawer(relative) &&
    /from\s+['"]@\/lib\/api\/browser/.test(source)
  ) {
    violations.push(
      `${relative}: tables and filter drawers must remain presentation-only and must not import browser API adapters`
    );
  }
}

//===================================================================

const detailsPath = path.join(
  root,
  'apps/pharmacy/src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
);

const detailsSource = await readFile(detailsPath, 'utf8');

assert.match(
  detailsSource,
  /type ProductDetailsMode = 'all' \| 'own'/,
  'Product Details must expose one explicit all/own mode contract'
);

assert.match(
  detailsSource,
  /PRODUCT_DETAILS_MODE_CONFIG[\s\S]*showAddAction: true[\s\S]*showRemoveAction: false[\s\S]*showAddAction: false[\s\S]*showRemoveAction: true/,
  'Product Details mode config must prevent add/remove action combinations that are impossible for the route mode'
);

assert.doesNotMatch(
  detailsSource,
  /showAddAction\?:|showRemoveAction\?:|backHref\?:|backLabel\?:|bannerTitle\?:|bannerMessage\?:/,
  'Product Details route semantics must not be configurable through independent boolean/string props'
);

const productsIndex = await readFile(
  path.join(root, 'apps/pharmacy/src/components/products/index.ts'),
  'utf8'
);

const ownProductsPageIndex = await readFile(
  path.join(
    root,
    'apps/pharmacy/src/components/products/OwnProductsPageContent/index.ts'
  ),
  'utf8'
);

assert.doesNotMatch(
  `${productsIndex}\n${ownProductsPageIndex}`,
  /export\s+type\s+\{\s*OwnProductsFilterState\s*\}/,
  'Component barrels must not re-export the canonical OwnProductsFilterState domain type'
);

//===================================================================

const [
  validationConstants,
  nextApiPolicy,
  apiBodyLimits,
  createRequestRoute,
  requestDetailsRoute,
] = await Promise.all([
  readFile(
    path.join(
      root,
      'packages/validation/src/product-requests/product-request-constants.ts'
    ),
    'utf8'
  ),

  readFile(
    path.join(root, 'packages/next-api/src/internal/transport-policy.ts'),
    'utf8'
  ),

  readFile(path.join(root, 'apps/api/src/constants/request-body.ts'), 'utf8'),
  readFile(
    path.join(root, 'apps/pharmacy/src/app/api/product-requests/route.ts'),
    'utf8'
  ),

  readFile(
    path.join(
      root,
      'apps/pharmacy/src/app/api/product-requests/[requestId]/route.ts'
    ),
    'utf8'
  ),
]);

const imageMaxBytes = readNumericProperty(validationConstants, 'maxSizeBytes');

const attachmentRulesSource = validationConstants.slice(
  validationConstants.indexOf('export const PRODUCT_REQUEST_ATTACHMENT_RULES')
);

const attachmentsMaxFiles = readNumericProperty(
  attachmentRulesSource,
  'maxFiles'
);

const attachmentsMaxTotalBytes = readNumericProperty(
  attachmentRulesSource,
  'maxTotalSizeBytes'
);

const documentUploadLimitBytes = readNumericProperty(
  nextApiPolicy.slice(
    nextApiPolicy.indexOf('export const PROXY_REQUEST_BODY_LIMITS_BYTES')
  ),
  'documentUpload'
);

const DATA_URL_PREFIX_BUDGET_BYTES = 128;
const JSON_AND_TEXT_METADATA_BUDGET_BYTES = 256 * 1024;

const maximumEncodedFilesBytes =
  getBase64Length(imageMaxBytes) +
  DATA_URL_PREFIX_BUDGET_BYTES +
  getBase64Length(attachmentsMaxTotalBytes) +
  attachmentsMaxFiles * (DATA_URL_PREFIX_BUDGET_BYTES + 4);

assert.ok(
  maximumEncodedFilesBytes + JSON_AND_TEXT_METADATA_BUDGET_BYTES <
    documentUploadLimitBytes,
  'The maximum valid product-request base64 payload must fit inside the Next.js documentUpload proxy budget'
);

assert.match(
  apiBodyLimits,
  /documentUpload:\s*'32mb'/,
  'API and BFF document-upload body budgets must remain aligned at 32 MB'
);

assert.match(
  createRequestRoute,
  /method:\s*'POST'[\s\S]*bodyPreset:\s*'documentUpload'/,
  'Product-request create BFF route must opt into the documentUpload body budget'
);

assert.match(
  requestDetailsRoute,
  /method:\s*'PATCH'[\s\S]*bodyPreset:\s*'documentUpload'/,
  'Product-request update BFF route must opt into the documentUpload body budget'
);

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy product-component check passed (${files.length} feature source files scanned).`
);
