import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTypeScript, parseTypeScriptFile } from './config-source-ast.mjs';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');
const CONFIG_DIR = path.join(ROOT_DIR, 'packages', 'config');
const ts = loadTypeScript(ROOT_DIR);

const INTENTIONAL_PUBLIC_CONTRACTS = new Set([
  'StatusPresentation',
  'StatusPresentationTone',
]);

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  'coverage',
]);

//===================================================================

async function collectSourceFiles(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, output);
    } else if (['.ts', '.tsx', '.js', '.mjs', '.cjs'].includes(path.extname(entry.name))) {
      output.push(entryPath);
    }
  }

  return output;
}

//===================================================================

const packageJson = JSON.parse(
  await readFile(path.join(CONFIG_DIR, 'package.json'), 'utf8')
);

const visited = new Set();
const publicExports = new Map();

async function collectExports(filePath) {
  const normalizedPath = path.normalize(filePath);
  if (visited.has(normalizedPath)) return;
  visited.add(normalizedPath);

  const sourceFile = await parseTypeScriptFile(ts, normalizedPath);

  for (const statement of sourceFile.statements) {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement) ?? []
      : [];
    const isExported = modifiers.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    );

    if (isExported && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          publicExports.set(declaration.name.text, normalizedPath);
        }
      }
    }

    if (
      isExported &&
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement)) &&
      statement.name
    ) {
      publicExports.set(statement.name.text, normalizedPath);
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const target = path.resolve(
        path.dirname(normalizedPath),
        `${statement.moduleSpecifier.text}.ts`
      );

      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          publicExports.set(element.name.text, target);
        }
      } else {
        await collectExports(target);
      }
    }
  }
}

for (const target of Object.values(packageJson.exports)) {
  await collectExports(
    path.join(CONFIG_DIR, target.replace(/^\.\//, ''))
  );
}

//===================================================================

const consumerFiles = [
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'apps'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'packages'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'scripts'))),
].filter(
  (filePath) =>
    !filePath.startsWith(path.join(CONFIG_DIR, 'src')) &&
    filePath !== CURRENT_FILE
);

const consumerText = (
  await Promise.all(consumerFiles.map((filePath) => readFile(filePath, 'utf8')))
).join('\n');

const unused = [];

for (const [exportName, sourceFile] of publicExports) {
  if (INTENTIONAL_PUBLIC_CONTRACTS.has(exportName)) continue;

  const pattern = new RegExp(`\\b${exportName.replaceAll('$', '\\$')}\\b`);
  if (!pattern.test(consumerText)) {
    unused.push(
      `${exportName} (${path.relative(ROOT_DIR, sourceFile).replaceAll('\\', '/')})`
    );
  }
}

assert.deepEqual(
  unused,
  [],
  `Unused config exports:\n${unused.map((item) => `- ${item}`).join('\n')}`
);

console.log(
  `Config unused-export check passed (${publicExports.size} public exports, ${INTENTIONAL_PUBLIC_CONTRACTS.size} intentional contracts).`
);
