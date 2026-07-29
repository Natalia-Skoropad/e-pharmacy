import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const clientRoot = path.join(root, 'apps/client/src');
const ignored = new Set([
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

//===================================================================

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(target)));
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(target);
  }
  return files;
}

//===================================================================

for (const removedPath of [
  'apps/client/src/lib/cart/cart-commands.ts',
  'apps/client/src/lib/cart/cart-events.ts',
  'apps/client/src/lib/cart/useCartMutations.ts',
]) {
  assert.equal(
    await exists(removedPath),
    false,
    `${removedPath} must be deleted.`
  );
}

const files = await listFiles(clientRoot);
const intentionalSharedReexportAllowlist = new Set([
  'apps/client/src/lib/routes/index.ts',
]);

const suspiciousSharedReexports = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(root, file).replaceAll('\\', '/');

  if (
    /^export\s+(?:\*|\{[^}]+\})\s+from\s+['"]@e-pharmacy\//m.test(source) &&
    !intentionalSharedReexportAllowlist.has(relative)
  ) {
    suspiciousSharedReexports.push(relative);
  }
}

assert.deepEqual(
  suspiciousSharedReexports,
  [],
  'Client source must not contain local wrappers that only re-export shared package symbols.'
);

const routesBarrel = await readFile(
  path.join(clientRoot, 'routes/index.ts'),
  'utf8'
);

assert.match(routesBarrel, /ClientProtectedRoute/);
assert.match(routesBarrel, /ClientGuestOnlyRoute/);
assert.doesNotMatch(routesBarrel, /export \{ default \} from/);

console.log(
  `Client no-op wrapper check passed (${files.length} client source files scanned).`
);
