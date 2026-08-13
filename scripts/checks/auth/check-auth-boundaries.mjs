import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

const AUTH_SRC_DIR = path.join(ROOT_DIR, 'packages', 'auth', 'src');

const IGNORED = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

//===================================================================

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

function readModuleSpecifiers(source) {
  const results = [];
  const pattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) results.push(match[1]);
  return results;
}

//===================================================================

const violations = [];
const authFiles = await collectFiles(AUTH_SRC_DIR);

//===================================================================

for (const filePath of authFiles) {
  if (filePath.endsWith('.test.ts')) continue;
  const source = await readFile(filePath, 'utf8');
  const relative = path.relative(ROOT_DIR, filePath).replaceAll('\\', '/');
  const specifiers = readModuleSpecifiers(source);

  for (const specifier of specifiers) {
    if (
      specifier.startsWith('@/') ||
      specifier.startsWith('apps/') ||
      specifier.includes('/apps/') ||
      specifier.startsWith('@e-pharmacy/ui') ||
      specifier.startsWith('@e-pharmacy/api') ||
      specifier.startsWith('@e-pharmacy/api-client') ||
      specifier.startsWith('@e-pharmacy/next-api')
    ) {
      violations.push(
        `${relative}: forbidden application/backend/UI import ${specifier}`
      );
    }

    if (
      relative.includes('/core/') &&
      (specifier === 'next' || specifier.startsWith('next/'))
    ) {
      violations.push(`${relative}: React core must not import Next.js`);
    }

    if (
      relative.includes('/routing/') &&
      (specifier === 'react' ||
        specifier.startsWith('react/') ||
        specifier === 'next' ||
        specifier.startsWith('next/'))
    ) {
      violations.push(
        `${relative}: pure routing must not import React or Next.js`
      );
    }
  }

  if (
    relative.includes('/routing/') &&
    /\b(?:window|document|localStorage|sessionStorage)\b/.test(source)
  ) {
    violations.push(`${relative}: pure routing must not use browser state`);
  }

  if (
    /\b(?:accessToken|refreshToken|BFF_PROXY_SECRET|JWT_SECRET)\b/.test(source)
  ) {
    violations.push(
      `${relative}: frontend auth package must not store tokens or server secrets`
    );
  }
}

//===================================================================

const backendFiles = await collectFiles(
  path.join(ROOT_DIR, 'apps', 'api', 'src')
);

for (const filePath of backendFiles) {
  const source = await readFile(filePath, 'utf8');
  if (source.includes('@e-pharmacy/auth') || source.includes('packages/auth')) {
    violations.push(
      `${path.relative(ROOT_DIR, filePath).replaceAll('\\', '/')}: backend must not import @e-pharmacy/auth`
    );
  }
}

const packageJson = JSON.parse(
  await readFile(
    path.join(ROOT_DIR, 'packages', 'auth', 'package.json'),
    'utf8'
  )
);

assert.deepEqual(
  Object.keys(packageJson.dependencies ?? {}).sort(),
  ['@e-pharmacy/config', '@e-pharmacy/types', '@e-pharmacy/utils'],
  'Auth runtime dependencies must remain limited to shared type/config/utility contracts'
);

assert.deepEqual(
  violations,
  [],
  `Auth boundary violations:\n${violations.map((item) => `- ${item}`).join('\n')}`
);

console.log(
  `Auth boundary check passed (${authFiles.length} auth source files scanned).`
);
