import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

//===================================================================

const ALLOWED_EXPORTS = [
  '.',
  './api',
  './auth',
  './cart',
  './notes',
  './orders',
  './pharmacies',
  './primitives',
  './product-requests',
  './products',
  './reviews',
];

//===================================================================

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.mjs']);

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  '.turbo',
  '.git',
]);

//===================================================================

async function collectSourceFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;

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
  await readFile(
    path.join(ROOT_DIR, 'packages', 'types', 'package.json'),
    'utf8'
  )
);

//===================================================================

assert.deepEqual(
  Object.keys(packageJson.exports).sort(),
  [...ALLOWED_EXPORTS].sort(),
  '@e-pharmacy/types exports must contain only the approved public entrypoints'
);

//===================================================================

const sourceFiles = [
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'apps'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'packages'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'scripts'))),
];

//===================================================================

const rootImportPattern = /(?:from\s+|import\s*\()(['"])@e-pharmacy\/types\1/g;

const forbiddenSubpathPattern =
  /@e-pharmacy\/types\/(navigation|files|clients|shared)(?:['"/])/g;

const violations = [];

//===================================================================

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');

  if (file.includes(path.join('packages', 'types', 'src'))) continue;

  if (rootImportPattern.test(source)) {
    violations.push(
      `${path.relative(ROOT_DIR, file)} imports the root @e-pharmacy/types entrypoint`
    );
  }

  rootImportPattern.lastIndex = 0;

  if (forbiddenSubpathPattern.test(source)) {
    violations.push(
      `${path.relative(ROOT_DIR, file)} imports a removed @e-pharmacy/types subpath`
    );
  }

  forbiddenSubpathPattern.lastIndex = 0;
}

//===================================================================

assert.deepEqual(violations, [], violations.join('\n'));

//===================================================================

console.log(
  `Types public API check passed (${sourceFiles.length} source files scanned, ${ALLOWED_EXPORTS.length} approved entrypoints).`
);
