#!/usr/bin/env node
// M1 architecture gate. No database access, migrations, or file writes.
// Historical inventory is immutable: hashes normalize only resolved relative paths.
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const inventory = JSON.parse(
  readFileSync(
    path.join(root, 'docs/architecture/models-m1/model-inventory.json'),
    'utf8'
  )
);

const manifest = JSON.parse(
  readFileSync(
    path.join(root, 'docs/architecture/models-m1/model-relocation-map.json'),
    'utf8'
  )
);

const scope = 'apps/api/src/models/';

const excluded = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
]);

const code = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

const extensions = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
  '/index.ts',
  '/index.tsx',
];

//===================================================================

function walk(directory, files = []) {
  for (const entry of readdirSync(path.join(root, directory), {
    withFileTypes: true,
  })) {
    if (excluded.has(entry.name)) continue;

    const filename = path.posix.join(directory, entry.name);

    if (entry.isDirectory()) walk(filename, files);
    else if (entry.isFile() && code.test(entry.name)) files.push(filename);
  }

  return files;
}

//===================================================================

function relativeResolution(caller, specifier, files) {
  if (!specifier.startsWith('.')) return null;

  const candidate = path.posix.normalize(
    path.posix.join(path.posix.dirname(caller), specifier)
  );

  return (
    extensions
      .map((ext) => `${candidate}${ext}`)
      .find((file) => files.has(file)) ?? null
  );
}

//===================================================================

function sha(text) {
  return createHash('sha256').update(text).digest('hex');
}

//===================================================================

assert.equal(inventory.schemaVersion, 1);
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.scope, scope);
assert.equal(manifest.moves.length, inventory.files.length);
assert.equal(inventory.modelCount, 27);
assert.equal(inventory.testCount, 3);

//===================================================================

const oldPaths = new Set();
const targets = new Set();
const canonicalOld = new Map();

for (const entry of manifest.moves) {
  assert(entry.from.startsWith(scope) && entry.to.startsWith(scope));
  assert(!entry.from.includes('..') && !entry.to.includes('..'));
  assert(!oldPaths.has(entry.from) && !targets.has(entry.to));

  oldPaths.add(entry.from);
  targets.add(entry.to);
  canonicalOld.set(entry.to, entry.from);

  assert(
    !existsSync(path.join(root, entry.from)),
    `Legacy proxy or obsolete model: ${entry.from}`
  );

  assert(
    existsSync(path.join(root, entry.to)),
    `Missing canonical model: ${entry.to}`
  );
}

//===================================================================

const files = new Set(
  ['apps', 'packages', 'scripts'].flatMap((dir) => walk(dir))
);

const actualModels = [...files].filter(
  (file) => file.startsWith(scope) && file.endsWith('.ts')
);

assert.equal(
  actualModels.length,
  manifest.moves.length,
  'Model files must exactly match relocation manifest'
);

for (const file of actualModels)
  assert(targets.has(file), `Unexpected top-level/proxy model: ${file}`);

//===================================================================

// This normalizes a moved module's imports to their original resolved targets.
// Any field, index, hook, validator, method or model name change changes the hash.
function canonicalSource(source, caller) {
  return source.replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, (literal) => {
    const quote = literal[0];
    const spec = literal.slice(1, -1);

    if (!spec.startsWith('.') || spec.includes('\\') || spec.includes('${'))
      return literal;

    const target = relativeResolution(caller, spec, files);

    if (!target) return literal;

    return `${quote}<REPO:${canonicalOld.get(target) ?? target}>${quote}`;
  });
}

//===================================================================

let indexes = 0;
let schemaCount = 0;

for (const item of inventory.files) {
  const entry = manifest.moves.find((move) => move.from === item.fromPath);

  assert(entry && entry.to === item.toPath && entry.domain === item.domain);

  const text = readFileSync(path.join(root, item.toPath), 'utf8');
  const hash = sha(canonicalSource(text, item.toPath));

  assert.equal(
    hash,
    item.canonicalSourceSha256,
    `Model/schema/test altered beyond direct path rewrites: ${item.toPath}`
  );

  indexes += item.indexDeclarations;
  schemaCount += item.schemaDeclarations;
}

//===================================================================

// Check that all local imports resolve (including service, controllers, scripts, checks),
// without considering CSS / static assets to be TS modules.
const imported =
  /\bfrom\s*['"](\.[^'"\n]+)['"]|\bimport\s*\(\s*['"](\.[^'"\n]+)['"]|\brequire\s*\(\s*['"](\.[^'"\n]+)['"]/g;

let resolved = 0;
let modelReferences = 0;

const basename = [...oldPaths].map((source) => path.posix.basename(source));

const stale = new RegExp(
  `(?:^|[^\\w])models/(?:${basename.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w.])`
);

const splitStale = new RegExp(
  `['"]models['"]\\s*,\\s*['"](?:${basename.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})['"]`
);

for (const caller of files) {
  const text = readFileSync(path.join(root, caller), 'utf8');

  assert(!stale.test(text), `Legacy source path in ${caller}`);
  assert(!splitStale.test(text), `Legacy split model path in ${caller}`);

  if (
    caller.startsWith('scripts/architecture/') &&
    caller.endsWith('.test.mjs')
  )
    continue;

  for (const match of text.matchAll(imported)) {
    const spec = match[1] ?? match[2] ?? match[3];
    const candidate = relativeResolution(caller, spec, files);

    // TypeScript source imports always resolve; CSS/JSON import paths aren't TS modules.
    if (candidate) {
      resolved++;

      if (candidate.startsWith(scope)) modelReferences++;
    } else if (
      !/\.(?:css|scss|sass|less|json|svg|png|webp|woff2?)$/i.test(spec)
    ) {
      throw Error(`Unresolved relative import: ${caller} -> ${spec}`);
    }
  }
}

//===================================================================

// All production Mongoose model files should be independent of one another.
// Tests intentionally exercise models from multiple domains, but must not cause imports
// among production models or their registration cycles.
const prod = new Set(
  inventory.files.filter((f) => f.kind === 'model').map((f) => f.toPath)
);

for (const filename of prod) {
  const text = readFileSync(path.join(root, filename), 'utf8');

  for (const match of text.matchAll(imported)) {
    const target = relativeResolution(
      filename,
      match[1] ?? match[2] ?? match[3],
      files
    );

    assert(
      !prod.has(target),
      `Model-to-model import / potential circular initialization: ${filename} -> ${target}`
    );
  }
}

//===================================================================

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      models: inventory.modelCount,
      tests: inventory.testCount,
      relocated: targets.size,
      preservedIndexDeclarations: indexes,
      preservedSchemaDeclarations: schemaCount,
      resolvedCodeImports: resolved,
      modelImportReferences: modelReferences,
      obsoleteModelFiles: 0,
      invalidSchemaFingerprints: 0,
    },
    null,
    2
  )
);
