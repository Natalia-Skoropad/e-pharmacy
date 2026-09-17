import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const featureRoots = [
  'apps/pharmacy/src/components/dashboard',
  'apps/pharmacy/src/components/sales',
  'apps/pharmacy/src/components/statistics',
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

function isPresentationFeature(relativePath) {
  return /apps\/pharmacy\/src\/components\/(?:sales|statistics)\//.test(
    relativePath
  );
}

function getFunctionSource(source, functionName) {
  const functionStart = source.indexOf(`function ${functionName}`);
  assert.notEqual(
    functionStart,
    -1,
    `Could not find function ${functionName} for analytics contract check.`
  );

  const bodyStart = source.indexOf('{', functionStart);
  assert.notEqual(
    bodyStart,
    -1,
    `Could not find function body for ${functionName}.`
  );

  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];

    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;

    if (depth === 0) return source.slice(functionStart, index + 1);
  }

  assert.fail(`Could not read complete function body for ${functionName}.`);
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
      `${relative}: analytics components must not import backend/server modules`
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(
      `${relative}: analytics components must use pharmacy browser API adapters instead of direct fetch`
    );
  }

  if (
    /\b(?:Authorization|accessToken|refreshToken)\b|document\.cookie|\blocalStorage\b/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: analytics components must not own auth token/cookie state`
    );
  }

  if (
    /https?:\/\/(?:localhost|127\.0\.0\.1)|NEXT_PUBLIC_[A-Z0-9_]*API|BACKEND_URL/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: analytics components must not embed backend URLs`
    );
  }

  if (/\b(?:type|interface)\s+[A-Za-z0-9_]*Dto\b/.test(source)) {
    violations.push(
      `${relative}: canonical analytics DTO types must remain in shared/domain layers`
    );
  }

  if (
    isPresentationFeature(relative) &&
    /from\s+['"]@\/lib\/api\/browser(?:\/[^'"]*)?['"]/.test(source)
  ) {
    violations.push(
      `${relative}: sales/statistics presentation components must not import browser API adapters`
    );
  }
}

//===================================================================

const dashboardSource = await readFile(
  path.join(
    root,
    'apps/pharmacy/src/components/dashboard/PharmacyDashboardPageContent/PharmacyDashboardPageContent.tsx'
  ),
  'utf8'
);

assert.match(
  dashboardSource,
  /Promise\.allSettled\s*\(/,
  'Dashboard resources must keep independent failure boundaries via Promise.allSettled.'
);

assert.doesNotMatch(
  dashboardSource,
  /\bgetPharmacyProducts\b|\boverview\s*:/,
  'Dashboard must not restore the dead product-list overview request.'
);

const productRequestStatisticsSource = await readFile(
  path.join(
    root,
    'apps/pharmacy/src/lib/product-requests/product-request-statistics.ts'
  ),
  'utf8'
);

assert.match(
  productRequestStatisticsSource,
  /getPharmacyProductRequestStatisticsRequest\s*\(/,
  'Product-request statistics must use the dedicated statistics request.'
);

assert.doesNotMatch(
  productRequestStatisticsSource,
  /\bgetPharmacyProductRequests\b|PRODUCT_REQUEST_STATUSES\.map|Promise\.all\s*\(/,
  'Product-request statistics must not fan out into per-status list requests.'
);

const productStatisticsSource = await readFile(
  path.join(root, 'apps/pharmacy/src/lib/products/product-statistics.ts'),
  'utf8'
);

const allProductStatisticsFunction = getFunctionSource(
  productStatisticsSource,
  'getPharmacyAllProductStatistics'
);

assert.match(
  allProductStatisticsFunction,
  /getPharmacyAllProductStatisticsRequest\s*\(/,
  'All-product statistics must use the dedicated statistics request.'
);

assert.doesNotMatch(
  allProductStatisticsFunction,
  /\bgetProducts\b|\bgetPharmacyProducts\b|Promise\.all\s*\(/,
  'All-product statistics must not fan out into catalog list requests.'
);

//===================================================================

const [orderRoutesSource, productRequestRoutesSource, productRoutesSource] =
  await Promise.all([
    readFile(path.join(root, 'apps/api/src/routes/order.routes.ts'), 'utf8'),
    readFile(
      path.join(root, 'apps/api/src/routes/product-request.routes.ts'),
      'utf8'
    ),
    readFile(path.join(root, 'apps/api/src/routes/product.routes.ts'), 'utf8'),
  ]);

assert.match(
  orderRoutesSource,
  /['"]\/sales-statistics['"][\s\S]{0,220}authorizeRoles\(USER_ROLES\.PHARMACY\)/,
  'Sales statistics backend route must remain pharmacy-only.'
);

assert.match(
  productRequestRoutesSource,
  /['"]\/statistics['"][\s\S]{0,220}authorizeRoles\(USER_ROLES\.PHARMACY\)/,
  'Product-request statistics backend route must remain pharmacy-only.'
);

assert.match(
  productRoutesSource,
  /['"]\/management\/statistics['"][\s\S]{0,260}authorizeRoles\(USER_ROLES\.PHARMACY\)/,
  'Managed-product statistics backend route must remain pharmacy-only.'
);

//===================================================================

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy analytics-component check passed (${files.length} feature source files scanned; request fan-out and role guards verified).`
);
