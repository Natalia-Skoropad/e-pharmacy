import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

//===================================================================

const API_SOURCE_DIR = path.join(ROOT_DIR, 'apps', 'api', 'src');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

//===================================================================

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
]);

//===================================================================

const MODULE_SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

//===================================================================

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

function isPathInside(candidatePath, parentPath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return (
    relativePath !== '' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    relativePath !== '..' &&
    !path.isAbsolute(relativePath)
  );
}

//===================================================================

function isForbiddenSpecifier(specifier, sourceFile) {
  if (specifier.startsWith('@e-pharmacy/')) return true;
  if (/(?:^|[\\/])packages[\\/]/.test(specifier)) return true;

  if (!specifier.startsWith('.')) return false;

  const resolvedPath = path.resolve(path.dirname(sourceFile), specifier);
  return (
    isPathInside(resolvedPath, PACKAGES_DIR) || resolvedPath === PACKAGES_DIR
  );
}

//===================================================================

function findForbiddenImports(source, sourceFile) {
  const imports = [];

  for (const pattern of MODULE_SPECIFIER_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier || !isForbiddenSpecifier(specifier, sourceFile)) continue;

      const line = source.slice(0, match.index).split('\n').length;
      imports.push({ line, specifier });
    }
  }

  return imports;
}

//===================================================================

const violations = [];
const sourceFiles = await collectSourceFiles(API_SOURCE_DIR);

//===================================================================

for (const sourceFile of sourceFiles) {
  const source = await readFile(sourceFile, 'utf8');

  for (const violation of findForbiddenImports(source, sourceFile)) {
    violations.push({
      file: path.relative(ROOT_DIR, sourceFile),
      ...violation,
    });
  }
}

//===================================================================

if (violations.length > 0) {
  console.error(
    'Backend boundary violation: apps/api must not import frontend workspace packages.'
  );

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} imports ${violation.specifier}`
    );
  }

  process.exitCode = 1;
} else {
  console.log(
    `Backend boundary check passed (${sourceFiles.length} source files scanned).`
  );
}
