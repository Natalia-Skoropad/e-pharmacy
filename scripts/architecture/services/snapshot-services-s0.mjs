import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

// S0 is an immutable, pre-relocation baseline. Use --check to compare current
// source against the committed snapshot. After S1 relocation, preserve this
// snapshot as evidence; do not rewrite it to make the check green.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const services = 'apps/api/src/services/';
const output = resolve(root, 'docs/architecture/services-s0');
const sourceExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

//===================================================================

const ignore = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
]);

const check = process.argv.includes('--check');

//===================================================================

function allFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap((entry) => {
      if (ignore.has(entry.name)) return [];

      const path = join(dir, entry.name);

      return entry.isDirectory()
        ? allFiles(path)
        : entry.isFile()
          ? [path]
          : [];
    });
}

//===================================================================

const relativePath = (file) => relative(root, file).replaceAll('\\', '/');
const files = allFiles(root);
const codeFiles = files.filter((file) => sourceExt.has(extname(file)));

const serviceFiles = files.filter(
  (file) => relativePath(file).startsWith(services) && file.endsWith('.ts')
);

const testFiles = serviceFiles.filter((file) => file.endsWith('.test.ts'));

const productionFiles = serviceFiles.filter(
  (file) => !file.endsWith('.test.ts')
);

const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const lineAt = (content, pos) => content.slice(0, pos).split('\n').length;

const inventory = serviceFiles.map((file) => ({
  path: relativePath(file),
  kind: file.endsWith('.test.ts') ? 'test' : 'implementation-or-helper',
  sha256: sha256(readFileSync(file)),
}));

//===================================================================

function resolveImport(from, specifier) {
  if (!specifier.startsWith('.')) return null;

  const absolute = resolve(dirname(from), specifier);

  const candidates = [
    absolute,
    ...['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'].map(
      (ext) => absolute + ext
    ),

    ...['.ts', '.tsx', '.js', '.mjs'].map((ext) =>
      join(absolute, 'index' + ext)
    ),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));

  return match ? relativePath(match) : null;
}

//===================================================================

// Deterministic static import/export inventory. Deliberately keep raw module
// specifiers and unresolved imports (aliases/external packages), rather than
// silently pretending that all specifiers resolve with relative paths.
function moduleSpecifiers(content) {
  const found = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const firstLine = lines[i];
    const isImport = /^\s*import\s+(?!\()/.test(firstLine);
    const isReexport = /^\s*export\s+(?:type\s+)?(?:\{|\*)/.test(firstLine);

    if (!isImport && !isReexport) continue;

    const startLine = i + 1;

    let declaration = firstLine;

    while (
      !declaration.includes(';') &&
      i + 1 < lines.length &&
      i - startLine < 79
    ) {
      declaration += '\n' + lines[++i];
    }

    const from = declaration.match(/\bfrom\s*['"]([^'"\n]+)['"]/);

    const sideEffect =
      isImport && declaration.match(/^\s*import\s*['"]([^'"\n]+)['"]/);

    const specifier = from?.[1] ?? sideEffect?.[1];

    if (specifier)
      found.push({
        specifier,
        type: sideEffect ? 'side-effect' : 'static',
        line: startLine,
      });
  }

  const dynamicRe = /\b(?:import|require)\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  for (const match of content.matchAll(dynamicRe)) {
    found.push({
      specifier: match[1],
      type: 'dynamic-or-require',
      line: lineAt(content, match.index),
    });
  }

  return found.filter(
    (item, i, all) =>
      all.findIndex(
        (other) =>
          other.specifier === item.specifier &&
          other.line === item.line &&
          other.type === item.type
      ) === i
  );
}

//===================================================================

const edges = [];
const staticReferences = [];

const referenceRe =
  /(?:apps\/api\/src\/services\/|src\/services\/|(?:\.\.\/|\.\/)+services\/)[A-Za-z0-9_./-]+/g;

const joinReferenceRe =
  /(?:['"`]services['"`]|['"`]src['"`]|['"`]apps['"`])(?:\s*,\s*['"`][\w.-]+['"`]){1,8}/g;

for (const file of codeFiles) {
  const source = relativePath(file);
  const content = readFileSync(file, 'utf8');

  for (const { specifier, line, type } of moduleSpecifiers(content)) {
    const target = resolveImport(file, specifier);

    if (
      source.startsWith(services) ||
      target?.startsWith(services) ||
      specifier.includes('/services/')
    ) {
      edges.push({ source, line, type, specifier, resolvedTarget: target });
    }
  }

  for (const match of content.matchAll(referenceRe)) {
    staticReferences.push({
      source,
      line: lineAt(content, match.index),
      literal: match[0],
      type: 'path-fragment',
    });
  }

  // Cross-line path.join('src', 'services', 'foo.ts') is not caught by
  // path-fragment regex; keep these candidate call sites for manual review.
  for (const match of content.matchAll(joinReferenceRe)) {
    if (!/['"`]services['"`]/.test(match[0])) continue;

    staticReferences.push({
      source,
      line: lineAt(content, match.index),
      literal: match[0],
      type: 'path-segments',
    });
  }
}

//===================================================================

const sortLocations = (a, b) =>
  a.source.localeCompare(b.source, 'en') ||
  a.line - b.line ||
  (a.specifier ?? a.literal ?? a.symbol ?? a.operation ?? '').localeCompare(
    b.specifier ?? b.literal ?? b.symbol ?? b.operation ?? '',
    'en'
  );

edges.sort(sortLocations);
staticReferences.sort(sortLocations);

const apiExports = [];
const transactions = [];

for (const file of productionFiles) {
  const source = relativePath(file);
  const content = readFileSync(file, 'utf8');

  const symbolRe =
    /\bexport\s+(?:(?:default|declare|async|abstract)\s+)*(?:function|class|type|interface|const|let|enum)\s+([A-Za-z_$][\w$]*)/g;

  for (const match of content.matchAll(symbolRe)) {
    apiExports.push({
      source,
      line: lineAt(content, match.index),
      symbol: match[1],
    });
  }

  for (const match of content.matchAll(
    /\b(?:\.withTransaction\s*\(|\.startSession\s*\(|\.session\s*\()/g
  )) {
    transactions.push({
      source,
      line: lineAt(content, match.index),
      operation: match[0].trim(),
    });
  }
}

apiExports.sort(sortLocations);
transactions.sort(sortLocations);

const snapshots = {
  'service-files.json': {
    scope: services,

    counts: {
      total: inventory.length,
      implementationAndHelpers: productionFiles.length,
      tests: testFiles.length,
    },

    files: inventory,
  },

  'direct-imports.json': {
    note: 'Static-text import/export/require scan; aliases are preserved as unresolved. Only edges incident to services are included.',
    edges,
  },

  'static-source-references.json': {
    note: 'Source path fragments and path segment candidates; review before relocation. These may also include import strings.',
    references: staticReferences,
  },

  'public-exports-and-transactions.json': {
    note: 'Lexical inventory, not a runtime/API contract. See S0-BASELINE.md for protected behavior.',
    exports: apiExports,
    transactionCalls: transactions,
  },
};

assert.equal(
  inventory.length,
  143,
  'S0 archive must have 143 service TypeScript files.'
);

assert.equal(
  productionFiles.length,
  48,
  'S0 archive must have 48 non-test files.'
);

assert.equal(testFiles.length, 95, 'S0 archive must have 95 test files.');

for (const [name, data] of Object.entries(snapshots)) {
  const file = join(output, name);
  const value = JSON.stringify(data, null, 2) + '\n';

  if (check) {
    assert.equal(
      readFileSync(file, 'utf8'),
      value,
      `S0 snapshot drift: ${name}`
    );
  } else {
    writeFileSync(file, value);
  }
}

//===================================================================

console.log(
  `S0 baseline ${check ? 'verified' : 'written'}: ${inventory.length} services (${productionFiles.length} implementations/helpers, ${testFiles.length} tests), ${edges.length} direct import records, ${staticReferences.length} source-path candidates, ${apiExports.length} exported symbols, ${transactions.length} session/transaction call sites.`
);
