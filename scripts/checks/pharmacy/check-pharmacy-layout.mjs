import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const layoutRoot = path.join(root, 'apps/pharmacy/src/components/layout');

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

    if (/\.(?:ts|tsx|css)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

function isTestFile(file) {
  return /\.(?:test|react\.test|integration\.test)\.(?:ts|tsx)$/.test(file);
}

//===================================================================

const files = await listFiles(layoutRoot);
const violations = [];

//===================================================================

for (const file of files) {
  if (isTestFile(file)) continue;

  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (/from\s+['"]@\/lib\/api\/browser['"]/.test(source)) {
    violations.push(
      `${relative}: layout must import a narrow browser API adapter instead of the browser barrel`
    );
  }

  if (
    /from\s+['"](?:@e-pharmacy\/next-api\/server|@\/lib\/api\/server|[^'"]*apps\/api)/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: layout must not import server/backend modules`
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(`${relative}: layout must not perform direct fetch calls`);
  }

  if (
    /\b(?:accessToken|refreshToken|Authorization)\b|document\.cookie/.test(
      source
    )
  ) {
    violations.push(`${relative}: layout must not own auth token/cookie state`);
  }

  if (/\b(?:getMyPharmacyProfile|bankDetails|documents)\b/.test(source)) {
    violations.push(
      `${relative}: layout must not depend on full pharmacy profile data`
    );
  }

  if (/\.SideMenu-module__/.test(source)) {
    violations.push(
      `${relative}: layout CSS must not depend on generated shared SideMenu CSS-module internals`
    );
  }
}

//===================================================================

const sidebar = await readFile(
  path.join(layoutRoot, 'PharmacySidebar/PharmacySidebar.tsx'),
  'utf8'
);

assert.match(
  sidebar,
  /from ['"]@\/lib\/api\/browser\/orders\.api['"]/,
  'PharmacySidebar must depend on the narrow orders browser adapter'
);

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy-layout check passed (${files.length} layout source/style files scanned).`
);
