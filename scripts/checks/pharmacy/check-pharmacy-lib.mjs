import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const pharmacyLib = path.join(root, 'apps/pharmacy/src/lib');
const browserApiDirectory = path.join(pharmacyLib, 'api/browser');

const ignored = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'coverage',
]);

//===================================================================

async function listSourceFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(target)));
      continue;
    }

    if (/\.(?:ts|tsx|mts)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

function isTestFile(file) {
  return /\.(?:test|react\.test|integration\.test)\.(?:ts|tsx|mts)$/.test(file);
}

//===================================================================

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

//===================================================================

const violations = [];
const libFiles = await listSourceFiles(pharmacyLib);

for (const file of libFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (isTestFile(file)) continue;

  if (/from\s+['"]@\/(?:app|components|providers)(?:\/|['"])/.test(source)) {
    violations.push(
      `${relative}: lib must not import app/components/providers`
    );
  }

  if (/from\s+['"][^'"]*apps\/api(?:\/|['"])/.test(source)) {
    violations.push(
      `${relative}: pharmacy lib must not import backend app source`
    );
  }

  if (
    /\b(?:localStorage|sessionStorage|indexedDB)\b|document\.cookie/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: pharmacy lib must not persist/read browser auth state directly`
    );
  }

  if (/\b(?:accessToken|refreshToken)\b|\bAuthorization\b/.test(source)) {
    violations.push(
      `${relative}: pharmacy lib must not own auth tokens/Authorization headers`
    );
  }
}

const browserApiFiles = (await listSourceFiles(browserApiDirectory)).filter(
  (file) => file.endsWith('.api.ts')
);

for (const file of browserApiFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (!source.startsWith("import 'client-only';")) {
    violations.push(
      `${relative}: browser API module must start with client-only`
    );
  }

  if (!/from ['"]@e-pharmacy\/next-api\/browser['"]/.test(source)) {
    violations.push(
      `${relative}: browser API must use the shared same-origin browser transport`
    );
  }

  if (!/\blocalApiRequest\b/.test(source)) {
    violations.push(`${relative}: browser API must call localApiRequest`);
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(`${relative}: browser API must not call fetch directly`);
  }

  if (/\b(?:API_BASE_URL|BACKEND_URL|NEXT_PUBLIC_API_URL)\b/.test(source)) {
    violations.push(`${relative}: browser API must not read a backend origin`);
  }

  if (/['"]\/api\//.test(source)) {
    violations.push(
      `${relative}: browser API paths must come from pharmacyApiRoutes`
    );
  }

  if (/from ['"]@e-pharmacy\/next-api\/server/.test(source)) {
    violations.push(
      `${relative}: browser API must not import server transport`
    );
  }
}

if (await exists(path.join(pharmacyLib, 'layout/routes.ts'))) {
  violations.push(
    'apps/pharmacy/src/lib/layout/routes.ts: duplicate generic filter-route layer must stay removed'
  );
}

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy-lib check passed (${libFiles.length} lib modules, ${browserApiFiles.length} browser API adapters scanned).`
);
