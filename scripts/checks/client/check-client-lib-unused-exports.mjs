import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

//===================================================================

const root = process.cwd();

const removedCandidates = [
  'getApiHealth',
  'logoutAllUserSessions',
  'getCartOrdersCount',
  'getProductBySlugId',
  'getPharmacyBySlugId',
  'getUniquePharmacyCities',
  'hasActiveProductCatalogFilters',
  'hasActiveProductCatalogState',
  'hasLegacyProductCatalogSearchParams',
  'AppErrorMessage',
  'LOGIN_BENEFITS',
  'REGISTER_BENEFITS',
  'PASSWORD_RECOVERY_BENEFITS',
  'RESET_PASSWORD_BENEFITS',
];

const internalCandidates = new Map([
  [
    'apps/client/src/lib/api/server/cache-options.ts',
    ['PUBLIC_API_REVALIDATE_SECONDS', 'PUBLIC_API_TIMEOUT_MS'],
  ],
  ['apps/client/src/lib/cart/cart-mutation-queue.ts', ['CartMutationTask']],
  [
    'apps/client/src/lib/routes/reserved-root-slugs.ts',
    ['RESERVED_ROOT_SLUGS'],
  ],
]);

//===================================================================

function exportedNames(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true
  );

  const names = new Set();

  for (const statement of sourceFile.statements) {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;

    const isExported = modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    );

    if (
      isExported &&
      'name' in statement &&
      statement.name &&
      ts.isIdentifier(statement.name)
    ) {
      names.add(statement.name.text);
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements)
        names.add(element.name.text);
    }
  }

  return names;
}

const libFiles = [];

//===================================================================

async function walk(directory) {
  const { readdir } = await import('node:fs/promises');

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) libFiles.push(target);
  }
}

//===================================================================

await walk(path.join(root, 'apps/client/src/lib'));
//===================================================================

const combined = (
  await Promise.all(libFiles.map((file) => readFile(file, 'utf8')))
).join('\n');
for (const name of removedCandidates) {
  assert.doesNotMatch(
    combined,
    new RegExp(`\\b${name}\\b`),
    `${name} must remain removed.`
  );
}

//===================================================================

for (const [relativePath, names] of internalCandidates) {
  const source = await readFile(path.join(root, relativePath), 'utf8');
  const exports = exportedNames(source, relativePath);

  for (const name of names) {
    assert.equal(
      exports.has(name),
      false,
      `${name} must be internal in ${relativePath}.`
    );
  }
}

console.log(
  `Client-lib unused-export check passed (${removedCandidates.length} dead candidates absent, ${[...internalCandidates.values()].flat().length} symbols internal).`
);
