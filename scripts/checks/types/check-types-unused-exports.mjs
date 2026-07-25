import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

//===================================================================

const ENTRYPOINT_FILES = {
  api: 'packages/types/src/api/index.ts',
  auth: 'packages/types/src/auth/index.ts',
  cart: 'packages/types/src/cart/index.ts',
  notes: 'packages/types/src/notes/index.ts',
  orders: 'packages/types/src/orders/index.ts',
  pharmacies: 'packages/types/src/pharmacies/index.ts',
  primitives: 'packages/types/src/primitives/index.ts',
  'product-requests': 'packages/types/src/product-requests/index.ts',
  products: 'packages/types/src/products/index.ts',
  reviews: 'packages/types/src/reviews/index.ts',
};

//===================================================================

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  '.git',
]);

//===================================================================

/**
 * Public building blocks may be intentionally exposed even when current apps
 * only consume them through a larger response type or an active backend
 * endpoint intended for the future admin application.
 */
const INTENTIONALLY_PUBLIC = new Set([
  'api:ApiErrorResponse',
  'orders:ClientOrderActivityHistoryItem',
  'orders:ClientOrderItem',
  'orders:ClientOrderStatusHistoryItem',
  'orders:Currency',
  'orders:Delivery',
  'orders:OrderManagerCommentResponseDto',
  'pharmacies:PendingPharmacyReviewTarget',
  'pharmacies:PharmacyPendingModeration',
  'product-requests:ProductRequestHistoryResponseDto',
  'products:PendingProductReviewTarget',
  'products:ProductsSortOption',
  'products:ProductSummary',
  'reviews:ModerateReviewPayload',
  'reviews:PendingReview',
  'reviews:PendingReviewsQueryParams',
  'reviews:PendingReviewsResponse',
  'reviews:ReviewModerationResponse',
  'reviews:ReviewModerationStatus',
]);

//===================================================================

async function loadTypeScript() {
  try {
    const module = await import('typescript');
    return module.default ?? module;
  } catch {
    const fallbackPath = path.join(
      ROOT_DIR,
      'packages',
      'types',
      'node_modules',
      'typescript',
      'lib',
      'typescript.js'
    );

    const module = await import(pathToFileURL(fallbackPath).href);
    return module.default ?? module;
  }
}

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

const ts = await loadTypeScript();

const typeSourceFiles = await collectSourceFiles(
  path.join(ROOT_DIR, 'packages', 'types', 'src')
);

//===================================================================

const typeProgram = ts.createProgram(typeSourceFiles, {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});

//===================================================================

const checker = typeProgram.getTypeChecker();
const publicExports = new Map();

//===================================================================

for (const [entrypoint, relativeFile] of Object.entries(ENTRYPOINT_FILES)) {
  const sourceFile = typeProgram.getSourceFile(
    path.join(ROOT_DIR, relativeFile)
  );
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);

  assert.ok(moduleSymbol, `Could not read public exports from ${relativeFile}`);

  publicExports.set(
    entrypoint,
    new Set(
      checker.getExportsOfModule(moduleSymbol).map((symbol) => symbol.name)
    )
  );
}

//===================================================================

const usedExports = new Map(
  [...publicExports.keys()].map((entrypoint) => [entrypoint, new Set()])
);

//===================================================================

const consumerFiles = [
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'apps'))),
  ...(await collectSourceFiles(path.join(ROOT_DIR, 'packages'))),
];

//===================================================================

for (const file of consumerFiles) {
  if (file.startsWith(path.join(ROOT_DIR, 'packages', 'types'))) continue;

  const sourceFile = ts.createSourceFile(
    file,
    await readFile(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }

    const match = statement.moduleSpecifier.text.match(
      /^@e-pharmacy\/types\/(.+)$/
    );

    if (!match || !usedExports.has(match[1])) continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings) continue;

    if (ts.isNamespaceImport(namedBindings)) {
      for (const name of publicExports.get(match[1])) {
        usedExports.get(match[1]).add(name);
      }
      continue;
    }

    for (const element of namedBindings.elements) {
      usedExports
        .get(match[1])
        .add((element.propertyName ?? element.name).text);
    }
  }
}

//===================================================================

const unexpectedUnusedExports = [];

for (const [entrypoint, exports] of publicExports) {
  for (const exportName of exports) {
    if (usedExports.get(entrypoint).has(exportName)) continue;

    const key = `${entrypoint}:${exportName}`;
    if (!INTENTIONALLY_PUBLIC.has(key)) {
      unexpectedUnusedExports.push(key);
    }
  }
}

//===================================================================

assert.deepEqual(
  unexpectedUnusedExports,
  [],
  `Unexpected unused @e-pharmacy/types exports:\n${unexpectedUnusedExports.join('\n')}`
);

//===================================================================

console.log(
  `Types unused-export check passed (${consumerFiles.length} consumer source files scanned, ${INTENTIONALLY_PUBLIC.size} intentional public contracts).`
);
