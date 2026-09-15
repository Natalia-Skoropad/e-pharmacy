import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const featureRoot = path.join(root, 'apps/pharmacy/src/components/clients');

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

function isTableOrDrawer(relativePath) {
  return /(?:Table|FiltersDrawer)\/[^/]+\.tsx$/.test(relativePath);
}

function isComponentBarrel(relativePath) {
  return /(?:^|\/)index\.ts$/.test(relativePath);
}

//===================================================================

const files = await listFiles(featureRoot);
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
      `${relative}: client components must not import backend/server modules`
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(
      `${relative}: client components must use pharmacy browser API adapters instead of direct fetch`
    );
  }

  if (
    /\b(?:Authorization|accessToken|refreshToken)\b|document\.cookie|\blocalStorage\b/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: client components must not own auth token/cookie state`
    );
  }

  if (
    /https?:\/\/(?:localhost|127\.0\.0\.1)|NEXT_PUBLIC_[A-Z0-9_]*API|BACKEND_URL/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: client components must not embed backend URLs`
    );
  }

  if (/\b(?:type|interface)\s+[A-Za-z0-9_]*Dto\b/.test(source)) {
    violations.push(
      `${relative}: canonical DTO types must remain in lib/shared layers`
    );
  }

  if (/\bconst\s+(?:CLIENT|USER)_STATUSES\b/.test(source)) {
    violations.push(
      `${relative}: canonical client/user status vocabularies must not be redefined in components`
    );
  }

  if (
    isTableOrDrawer(relative) &&
    /from\s+['"]@\/lib\/api\/browser(?:\/[^'"]*)?['"]/.test(source)
  ) {
    violations.push(
      `${relative}: tables and filter drawers must remain presentation-only and must not import browser API adapters`
    );
  }

  if (isComponentBarrel(relative)) {
    if (/export\s+type\b/.test(source)) {
      violations.push(
        `${relative}: component barrels must not re-export canonical domain types`
      );
    }

    if (/export\s+\*/.test(source)) {
      violations.push(
        `${relative}: component barrels must expose an explicit component API instead of wildcard re-exports`
      );
    }
  }
}

//===================================================================

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy client-component check passed (${files.length} feature source files scanned).`
);
