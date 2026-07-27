import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');
const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');
const IGNORED = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);

//===================================================================

async function collectFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(entryPath, output);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) output.push(entryPath);
  }
  return output;
}

//===================================================================

const provider = await read(
  'packages',
  'auth',
  'src',
  'core',
  'AuthProviderCore.tsx'
);
const providerTypes = await read(
  'packages',
  'auth',
  'src',
  'core',
  'auth-provider.types.ts'
);
const pharmacyProvider = await read(
  'apps',
  'pharmacy',
  'src',
  'providers',
  'AuthProvider',
  'AuthProvider.tsx'
);
const clientProfile = await read(
  'apps',
  'client',
  'src',
  'components',
  'profile',
  'ProfilePageContent',
  'ProfilePageContent.tsx'
);
const pharmacyProfile = await read(
  'apps',
  'pharmacy',
  'src',
  'components',
  'profile',
  'PharmacyProfilePageContent',
  'PharmacyProfilePageContent.tsx'
);
const clientProtected = await read(
  'apps',
  'client',
  'src',
  'routes',
  'ProtectedRoute',
  'ProtectedRoute.tsx'
);
const pharmacyProtected = await read(
  'apps',
  'pharmacy',
  'src',
  'components',
  'auth',
  'PharmacyProtectedRoute.tsx'
);
const clientAuthApi = await read(
  'apps',
  'client',
  'src',
  'lib',
  'api',
  'browser',
  'auth.api.ts'
);
const pharmacyAuthApi = await read(
  'apps',
  'pharmacy',
  'src',
  'lib',
  'api',
  'browser',
  'auth.api.ts'
);

assert.match(providerTypes, /signal:\s*AbortSignal/);
assert.match(providerTypes, /bootstrapMode:\s*'always'/);
assert.doesNotMatch(provider, /WeakMap|currentUserPromises|refreshPromises/);
assert.doesNotMatch(provider, /setInterval|refreshSession/);
assert.match(provider, /new AuthRequestManager\(\)/);
assert.match(provider, /retryAuthBootstrap/);
assert.doesNotMatch(
  pharmacyProvider,
  /Use the shared E-PHARMACY login page|async\s+login/
);
assert.match(clientProfile, /invalidateSession\('password_changed'\)/);
assert.match(pharmacyProfile, /invalidateSession\('password_changed'\)/);
assert.match(clientProtected, /retryAuthBootstrap/);
assert.match(pharmacyProtected, /retryAuthBootstrap/);
assert.match(clientAuthApi, /parseAuthResponse/);
assert.match(pharmacyAuthApi, /parseAuthResponse/);

const appFiles = [
  ...(await collectFiles(path.join(ROOT_DIR, 'apps', 'client', 'src'))),
  ...(await collectFiles(path.join(ROOT_DIR, 'apps', 'pharmacy', 'src'))),
];

const noOpWrappers = [];
for (const filePath of appFiles) {
  const source = (await readFile(filePath, 'utf8'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim();
  if (
    /^export\s+(?:\*|\{[\s\S]*\})\s+from\s+['"]@e-pharmacy\/[^"]+['"];?$/.test(
      source
    )
  ) {
    noOpWrappers.push(path.relative(ROOT_DIR, filePath).replaceAll('\\', '/'));
  }
}
assert.deepEqual(
  noOpWrappers,
  [],
  `No-op auth wrappers found:\n${noOpWrappers.join('\n')}`
);

console.log(
  `Auth lifecycle check passed (${appFiles.length} application source files scanned).`
);
