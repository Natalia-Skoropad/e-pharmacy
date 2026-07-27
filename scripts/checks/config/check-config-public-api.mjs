import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);

const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

const CONFIG_DIR = path.join(ROOT_DIR, 'packages', 'config');
const CONFIG_SRC_DIR = path.join(CONFIG_DIR, 'src');

//===================================================================

const EXPECTED_EXPORTS = {
  './auth': './src/auth/index.ts',
  './cart': './src/cart/index.ts',
  './orders': './src/orders/index.ts',
  './pharmacies': './src/pharmacies/index.ts',
  './products': './src/products/index.ts',
  './product-requests': './src/product-requests/index.ts',
  './users': './src/users/index.ts',
  './notes': './src/notes/index.ts',
  './presentation': './src/presentation/index.ts',
};

const FORBIDDEN_SUBPATHS = [
  'admin',
  'pharmacy',
  'navigation',
  'status',
  'clients',
];

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

//===================================================================

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function collectSourceFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, output);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      output.push(entryPath);
    }
  }

  return output;
}

//===================================================================

const packageJson = JSON.parse(
  await readFile(path.join(CONFIG_DIR, 'package.json'), 'utf8')
);

//===================================================================

assert.deepEqual(
  packageJson.exports,
  EXPECTED_EXPORTS,
  'Config package exports must contain only the approved explicit subpaths'
);

//===================================================================

for (const [entrypoint, target] of Object.entries(EXPECTED_EXPORTS)) {
  const targetPath = path.join(CONFIG_DIR, target.replace(/^\.\//, ''));

  assert.equal(
    await pathExists(targetPath),
    true,
    `Config entrypoint ${entrypoint} points to a missing file: ${target}`
  );
}

//===================================================================

assert.equal(
  await pathExists(path.join(CONFIG_SRC_DIR, 'index.ts')),
  false,
  'packages/config/src/index.ts must not exist because root imports are forbidden'
);

for (const directoryName of FORBIDDEN_SUBPATHS) {
  assert.equal(
    await pathExists(path.join(CONFIG_SRC_DIR, directoryName)),
    false,
    `Forbidden config area still exists: src/${directoryName}`
  );
}

//===================================================================

const sourceFiles = [
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'apps'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'packages'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'scripts'))),
];

const violations = [];

for (const sourceFile of sourceFiles) {
  if (sourceFile === CURRENT_FILE) continue;

  const source = await readFile(sourceFile, 'utf8');
  const relativePath = path
    .relative(ROOT_DIR, sourceFile)
    .replaceAll('\\', '/');

  if (
    /(?:from\s*|import\s*\(|require\s*\()\s*['"]@e-pharmacy\/config['"]/.test(
      source
    )
  ) {
    violations.push(`${relativePath}: root @e-pharmacy/config import`);
  }

  if (source.includes('@e-pharmacy/config/src')) {
    violations.push(`${relativePath}: deep @e-pharmacy/config/src import`);
  }

  for (const subpath of FORBIDDEN_SUBPATHS) {
    if (source.includes(`@e-pharmacy/config/${subpath}`)) {
      violations.push(
        `${relativePath}: forbidden @e-pharmacy/config/${subpath} import`
      );
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `Config public API violations:\n${violations.map((item) => `- ${item}`).join('\n')}`
);

console.log(
  `Config public API check passed (${sourceFiles.length} source files scanned, ${Object.keys(EXPECTED_EXPORTS).length} approved entrypoints).`
);
