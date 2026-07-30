import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

//===================================================================

const root = process.cwd();
const clientSource = path.join(root, 'apps/client/src');
const clientLib = path.join(clientSource, 'lib');

//===================================================================

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
    if (entry.isDirectory()) files.push(...(await listFiles(target)));
    else if (/\.(?:ts|tsx|mts)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

function importsOf(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier.text);
}

//===================================================================

const libFiles = await listFiles(clientLib);
const clientFiles = await listFiles(clientSource);
const violations = [];

//===================================================================

for (const file of libFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const imports = importsOf(source, file);
  const isTest = /\.(?:test|integration\.test)\.(?:ts|tsx)$/.test(relative);
  const isBrowser = relative.includes('/lib/api/browser/');

  const isServer =
    !isTest &&
    (relative.includes('/lib/api/server/') ||
      relative.includes('/lib/details/') ||
      relative.includes('/lib/seo/server/') ||
      relative.endsWith('-server.ts') ||
      relative.endsWith('-server.tsx'));

  if (isBrowser && !source.startsWith("import 'client-only';")) {
    violations.push(`${relative}: browser module must start with client-only`);
  }

  if (isServer && !source.startsWith("import 'server-only';")) {
    violations.push(`${relative}: server module must start with server-only`);
  }

  if (isBrowser && imports.some((value) => value.includes('/api/server'))) {
    violations.push(`${relative}: browser module imports server API`);
  }

  if (isBrowser && /process\.env\.(?!NEXT_PUBLIC_)/.test(source)) {
    violations.push(
      `${relative}: browser module reads a private environment variable`
    );
  }

  if (imports.some((value) => value.startsWith('@/components'))) {
    violations.push(`${relative}: lib must not import components`);
  }

  if (
    !isServer &&
    imports.some((value) => value === 'next' || value.startsWith('next/'))
  ) {
    violations.push(`${relative}: pure/client lib module imports Next.js`);
  }
} //===================================================================

for (const file of clientFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const imports = importsOf(source, file);
  const isClientComponent = /^['"]use client['"];?/m.test(source);

  if (
    isClientComponent &&
    imports.some(
      (value) =>
        value.startsWith('@/lib/api/server') ||
        value.startsWith('@/lib/details') ||
        value.startsWith('@/lib/seo/server')
    )
  ) {
    violations.push(
      `${relative}: client component imports a server-only entrypoint`
    );
  }
}

//===================================================================

for (const directory of ['apps/api', 'apps/pharmacy', 'packages']) {
  const files = await listFiles(path.join(root, directory));
  for (const file of files) {
    const source = await readFile(file, 'utf8');

    if (/apps\/client\/src\/lib/.test(source)) {
      violations.push(
        `${path.relative(root, file)}: non-client source imports client lib`
      );
    }
  }
}

//===================================================================

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Client-lib boundary check passed (${libFiles.length} lib modules scanned).`
);
