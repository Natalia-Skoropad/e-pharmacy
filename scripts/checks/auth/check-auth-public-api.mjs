import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');
const AUTH_DIR = path.join(ROOT_DIR, 'packages', 'auth');
const EXPECTED_EXPORTS = {
  './react': './src/react/index.ts',
  './next': './src/next/index.ts',
  './errors': './src/errors/index.ts',
  './routing': './src/routing/index.ts',
};
const IGNORED = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

//===================================================================

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(entryPath, output);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name)))
      output.push(entryPath);
  }
  return output;
}

//===================================================================

const packageJson = JSON.parse(
  await readFile(path.join(AUTH_DIR, 'package.json'), 'utf8')
);
assert.deepEqual(packageJson.exports, EXPECTED_EXPORTS);
assert.equal(packageJson.sideEffects, false);

for (const [entrypoint, target] of Object.entries(EXPECTED_EXPORTS)) {
  assert.equal(
    await exists(path.join(AUTH_DIR, target.replace(/^\.\//, ''))),
    true,
    `${entrypoint} points to a missing target`
  );
}

const publicIndexFiles = Object.values(EXPECTED_EXPORTS).map((target) =>
  path.join(AUTH_DIR, target.replace(/^\.\//, ''))
);
for (const filePath of publicIndexFiles) {
  const source = await readFile(filePath, 'utf8');
  assert.doesNotMatch(
    source,
    /export\s+\*\s+from/,
    `${filePath} must use explicit exports`
  );
}

const reactIndex = await readFile(
  path.join(AUTH_DIR, 'src/react/index.ts'),
  'utf8'
);
assert.match(reactIndex, /AuthProviderCore/);
assert.match(reactIndex, /useAuth/);
assert.doesNotMatch(
  reactIndex,
  /GuestOnlyRoute|RoleProtectedRoute|AuthSessionSync/
);

const nextIndex = await readFile(
  path.join(AUTH_DIR, 'src/next/index.ts'),
  'utf8'
);
assert.match(nextIndex, /GuestOnlyRouteProps/);
assert.match(nextIndex, /RoleProtectedRouteProps/);

const providerSource = await readFile(
  path.join(AUTH_DIR, 'src/core/AuthProviderCore.tsx'),
  'utf8'
);
assert.match(providerSource, /export function useAuth\(\): AuthContextValue/);

const sourceFiles = [
  ...(await collectFiles(path.join(ROOT_DIR, 'apps'))),
  ...(await collectFiles(path.join(ROOT_DIR, 'packages'))),
];

const violations = [];

for (const filePath of sourceFiles) {
  if (filePath === CURRENT_FILE) continue;
  const source = await readFile(filePath, 'utf8');
  const relative = path.relative(ROOT_DIR, filePath).replaceAll('\\', '/');

  if (/(?:from\s*|import\s*\()\s*['"]@e-pharmacy\/auth['"]/.test(source)) {
    violations.push(`${relative}: root auth import`);
  }
  if (source.includes('@e-pharmacy/auth/src')) {
    violations.push(`${relative}: deep auth import`);
  }
  for (const oldSubpath of ['core', 'guards', 'session']) {
    if (source.includes(`@e-pharmacy/auth/${oldSubpath}`)) {
      violations.push(`${relative}: removed auth subpath ${oldSubpath}`);
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `Auth public API violations:\n${violations.map((item) => `- ${item}`).join('\n')}`
);

console.log(
  `Auth public API check passed (${sourceFiles.length} source files scanned).`
);
