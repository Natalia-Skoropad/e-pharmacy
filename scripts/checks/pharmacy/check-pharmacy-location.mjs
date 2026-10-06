import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

//===================================================================

const SOURCE_ROOTS = [
  ['apps', 'api', 'src'],
  ['apps', 'client', 'src'],
  ['apps', 'pharmacy', 'src'],
  ['apps', 'admin', 'src'],
  ['packages', 'api-client', 'src'],
  ['packages', 'types', 'src'],
  ['packages', 'config', 'src'],
  ['packages', 'validation', 'src'],
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

const PHARMACY_DOMAIN_FILES = new Set([
  'apps/api/src/services/admin.service.ts',
  'apps/api/src/scripts/seed.ts',
  'packages/api-client/src/response/shared-dto-parsers.ts',
]);

//===================================================================

function isPharmacyDomainFile(relative) {
  return (
    PHARMACY_DOMAIN_FILES.has(relative) ||
    /(?:^|\/)(?:pharmacy|pharmacies)(?:[\/.\-]|$)/i.test(relative) ||
    /(?:^|\/)pharmacy-[^/]+/i.test(relative)
  );
}

//===================================================================

const LEGACY_LOCATION_ALLOWLIST = new Set([
  // One-time idempotent migration from pre-location Pharmacy persistence.
  'apps/api/src/services/pharmacy-location-migration.service.ts',

  // Historical order snapshots are immutable facts. New snapshots use location.
  'apps/api/src/models/order.model.ts',
  'apps/api/src/services/order.service.ts',
  'apps/api/src/types/order.ts',
]);

//===================================================================

async function collectProductionSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectProductionSources(target)));
      continue;
    }

    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    if (/\.(?:test|spec)\.[^.]+$/.test(entry.name)) continue;
    files.push(target);
  }

  return files;
}

//===================================================================

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
}

const productionFiles = (
  await Promise.all(
    SOURCE_ROOTS.map((segments) =>
      collectProductionSources(path.join(ROOT_DIR, ...segments))
    )
  )
).flat();

const violations = [];

for (const file of productionFiles) {
  const relative = path.relative(ROOT_DIR, file).replaceAll('\\', '/');
  if (LEGACY_LOCATION_ALLOWLIST.has(relative)) continue;

  const source = await readFile(file, 'utf8');
  const codeOnly = stripComments(source);

  const legacyIdentifierPatterns = [
    /\bcity\??\s*:/,
    /\b(?:const|let|var)\s+city\b/,
    /\.city\b/,
    /\bcity\s*;/,
    /[{,(]\s*city\s*[,)}]/,
    /\bpharmacyCity\??\s*:/,
    /\b(?:const|let|var)\s+pharmacyCity\b/,
    /\.pharmacyCity\b/,
    /\bpharmacyCity\s*;/,
    /[{,(]\s*pharmacyCity\s*[,)}]/,
  ];

  const hasPharmacyCityIdentifier = [
    /\bpharmacyCity\??\s*:/,
    /\b(?:const|let|var)\s+pharmacyCity\b/,
    /\.pharmacyCity\b/,
    /\bpharmacyCity\s*;/,
    /[{,(]\s*pharmacyCity\s*[,)}]/,
  ].some((pattern) => pattern.test(codeOnly));

  const hasLegacyCityIdentifier = legacyIdentifierPatterns
    .slice(0, 5)
    .some((pattern) => pattern.test(codeOnly));

  if (hasPharmacyCityIdentifier) {
    violations.push(
      `${relative}: legacy pharmacyCity identifier is forbidden.`
    );
  }

  if (isPharmacyDomainFile(relative) && hasLegacyCityIdentifier) {
    violations.push(
      `${relative}: legacy city identifier is forbidden in the live pharmacy domain.`
    );
  }

  if (/Pharmacy\.distinct\(\s*['"]city['"]\s*\)/.test(source)) {
    violations.push(`${relative}: Pharmacy.distinct('city') is forbidden.`);
  }

  if (/\[\s*['"]city['"]\s*\]/.test(source)) {
    violations.push(
      `${relative}: computed legacy city field access is forbidden.`
    );
  }

  if (/['"]\$city['"]/.test(source)) {
    violations.push(
      `${relative}: Mongo legacy $city field access is forbidden.`
    );
  }

  if (/['"]city-/.test(source)) {
    violations.push(`${relative}: legacy city-* catalog routes are forbidden.`);
  }
}

//===================================================================

const [
  pharmacyModel,
  pharmacySchema,
  pharmacyService,
  adminService,
  sharedPharmacyResponses,
  clientPharmacyFilters,
  clientPharmacyPaths,
  seed,
  orderModel,
  orderService,
] = await Promise.all([
  read('apps', 'api', 'src', 'models', 'pharmacy.model.ts'),
  read('apps', 'api', 'src', 'schemas', 'pharmacy.schema.ts'),
  read('apps', 'api', 'src', 'services', 'pharmacy.service.ts'),
  read('apps', 'api', 'src', 'services', 'admin.service.ts'),
  read('packages', 'types', 'src', 'pharmacies', 'responses.ts'),

  read(
    'apps',
    'client',
    'src',
    'lib',
    'catalog',
    'pharmacies-catalog-filters.ts'
  ),

  read(
    'apps',
    'client',
    'src',
    'lib',
    'catalog',
    'pharmacies-catalog-paths.ts'
  ),

  read('apps', 'api', 'src', 'scripts', 'seed.ts'),
  read('apps', 'api', 'src', 'models', 'order.model.ts'),
  read('apps', 'api', 'src', 'services', 'order.service.ts'),
]);

assert.doesNotMatch(pharmacyModel, /^\s*city\s*:/m);
assert.doesNotMatch(pharmacyModel, /['"]city['"]\s*:/);
assert.match(pharmacyModel, /['"]location\.settlement['"]:\s*1/);
assert.match(pharmacyModel, /['"]location\.address['"]:\s*['"]text['"]/);

assert.doesNotMatch(pharmacySchema, /^\s*city\s*:/m);
assert.doesNotMatch(pharmacyService, /query\.city/);
assert.doesNotMatch(pharmacyService, /LegacyPharmacyPendingModeration/);
assert.doesNotMatch(adminService, /LegacyPharmacyPendingModeration/);
assert.doesNotMatch(sharedPharmacyResponses, /^\s*city\??\s*:/m);
assert.doesNotMatch(clientPharmacyFilters, /^\s*city\??\s*:/m);
assert.doesNotMatch(clientPharmacyFilters, /params\.city/);
assert.doesNotMatch(clientPharmacyPaths, /['"]city-/);
assert.doesNotMatch(seed, /\bCITIES\b|\bconst\s+city\b/);
assert.match(seed, /\bSETTLEMENTS\b/);

// Stage 13.4.7 keeps exactly one runtime compatibility family: historical
// order snapshots. New order snapshots must still be canonical location-only.
assert.match(orderModel, /Stage 13\.4\.7 exception/);
assert.match(orderModel, /^\s*city:\s*\{\s*type:\s*String/m);
assert.match(orderService, /pharmacySnapshot\.city\?\.trim\(\)/);
assert.match(orderService, /createOrderPharmacySnapshot/);

assert.doesNotMatch(
  orderService,
  /pharmacySnapshot:\s*\{[\s\S]{0,260}?city:\s*pharmacy\.location\.settlement/
);

assert.deepEqual(violations, [], violations.join('\n'));

//===================================================================

console.log(
  `Pharmacy-location structural checks passed (${productionFiles.length} production modules scanned; ${LEGACY_LOCATION_ALLOWLIST.size} explicit legacy files allowlisted).`
);
