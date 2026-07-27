import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTypeScript, parseTypeScriptFile } from './config-source-ast.mjs';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');
const CONFIG_SRC_DIR = path.join(ROOT_DIR, 'packages', 'config', 'src');
const ts = loadTypeScript(ROOT_DIR);

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);

//===================================================================

async function collectFiles(directory, extensions, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectFiles(entryPath, extensions, output);
    } else if (extensions.has(path.extname(entry.name))) {
      output.push(entryPath);
    }
  }

  return output;
}

//===================================================================

const configFiles = await collectFiles(
  CONFIG_SRC_DIR,
  new Set(['.ts', '.tsx'])
);
const violations = [];

for (const filePath of configFiles) {
  const sourceFile = await parseTypeScriptFile(ts, filePath);
  const relativePath = path.relative(ROOT_DIR, filePath).replaceAll('\\', '/');
  const source = sourceFile.getFullText();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;

    const specifier = statement.moduleSpecifier.text;

    if (
      specifier === 'react' ||
      specifier.startsWith('react/') ||
      specifier === 'next' ||
      specifier.startsWith('next/') ||
      specifier.startsWith('@e-pharmacy/ui') ||
      specifier.startsWith('@e-pharmacy/api-client') ||
      specifier.startsWith('@e-pharmacy/auth') ||
      specifier.startsWith('@e-pharmacy/hooks') ||
      specifier.startsWith('apps/') ||
      specifier.includes('/apps/')
    ) {
      violations.push(`${relativePath}: forbidden import ${specifier}`);
    }

    if (
      !relativePath.includes('/presentation/') &&
      (specifier.includes('/presentation') ||
        specifier.startsWith('@e-pharmacy/ui'))
    ) {
      violations.push(
        `${relativePath}: domain config must not import presentation/UI modules`
      );
    }
  }

  if (/\b(?:window|document|localStorage|sessionStorage)\b/.test(source)) {
    violations.push(`${relativePath}: browser global in config source`);
  }

  if (/\b(?:NextRequest|NextResponse|ReactNode|JSX)\b/.test(source)) {
    violations.push(`${relativePath}: framework/UI type in config source`);
  }

  if (
    /\bnew\s+Set\s*\(|\.localeCompare\s*\(|\.(?:map|filter)\s*\(/.test(source)
  ) {
    violations.push(
      `${relativePath}: runtime data transformation in config source`
    );
  }
}

//===================================================================

for (const [directory, label] of [
  [path.join(ROOT_DIR, 'apps', 'api', 'src'), 'backend'],
  [path.join(ROOT_DIR, 'packages', 'types', 'src'), 'types'],
]) {
  const files = await collectFiles(directory, new Set(['.ts', '.tsx']));

  for (const filePath of files) {
    const source = await readFile(filePath, 'utf8');
    if (
      source.includes('@e-pharmacy/config') ||
      source.includes('packages/config')
    ) {
      violations.push(
        `${path.relative(ROOT_DIR, filePath).replaceAll('\\', '/')}: ${label} must not import config`
      );
    }
  }
}

//===================================================================

for (const packagePath of [
  ['packages', 'ui', 'package.json'],
  ['packages', 'api-client', 'package.json'],
]) {
  const packageJsonPath = path.join(ROOT_DIR, ...packagePath);
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
  };

  if ('@e-pharmacy/config' in dependencies) {
    violations.push(
      `${packagePath.join('/')}: unused @e-pharmacy/config dependency`
    );
  }
}

//===================================================================

const configPackage = JSON.parse(
  await readFile(
    path.join(ROOT_DIR, 'packages', 'config', 'package.json'),
    'utf8'
  )
);

//===================================================================

assert.deepEqual(
  Object.keys(configPackage.dependencies ?? {}).sort(),
  ['@e-pharmacy/types'],
  'Config runtime dependencies must remain limited to @e-pharmacy/types'
);

//===================================================================

assert.deepEqual(
  violations,
  [],
  `Config boundary violations:\n${violations.map((item) => `- ${item}`).join('\n')}`
);

//===================================================================

console.log(
  `Config boundary check passed (${configFiles.length} config source files scanned).`
);
