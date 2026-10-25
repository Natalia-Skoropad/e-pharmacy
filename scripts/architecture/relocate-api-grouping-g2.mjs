#!/usr/bin/env node
// G2: canonical Zod schemas and contract tests relocation. No runtime semantics changes.
// --dry-run is read-only; --apply has a full in-memory preflight; --check is read-only.
import assert from 'node:assert/strict';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const abs = (p) => path.join(ROOT, p);
const stage = 'G2';
const prefix = 'apps/api/src/schemas/';
const mapPath = 'docs/architecture/grouping-g0/relocation-plan.json';
const inventoryPath = 'docs/architecture/grouping-g0/source-inventory.json';

const checksPath = 'docs/architecture/grouping-g2/source-fingerprints.json';

const extensions = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
];

const code = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

const skipDirs = new Set([
  '.git',
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
  '.artifacts',
]);

//===================================================================

const excludeSources = new Set([
  // Read-only G0 history must keep its canonical *pre-move* paths.
  'scripts/architecture/api-grouping-g0-core.mjs',
  'scripts/architecture/check-api-grouping-g0.mjs',
  'scripts/architecture/check-api-grouping-g0.test.mjs',
  'scripts/architecture/relocate-api-grouping-g1.mjs',
  'scripts/architecture/relocate-api-grouping-g1.test.mjs',
  'scripts/architecture/relocate-api-grouping-g2.mjs',
  'scripts/architecture/relocate-api-grouping-g2.test.mjs',
  'scripts/architecture/relocate-api-grouping.mjs',
]);

//===================================================================

const arg = process.argv.slice(2);
const modes = ['--dry-run', '--apply', '--check'];

assert.equal(
  arg.filter((v) => modes.includes(v)).length,
  1,
  'Choose one of --dry-run, --apply or --check'
);

const stageArg = arg.indexOf('--stage');

if (stageArg !== -1)
  assert.equal(arg[stageArg + 1], stage, 'Only --stage G2 is supported');

assert(
  arg.every(
    (v, i) =>
      modes.includes(v) ||
      v === '--stage' ||
      (i === stageArg + 1 && v === stage)
  ),

  'Unknown argument'
);

const mode = modes.find((v) => arg.includes(v)).slice(2);
const inventory = JSON.parse(readFileSync(abs(inventoryPath), 'utf8'));
const manifest = JSON.parse(readFileSync(abs(mapPath), 'utf8'));

assert.equal(inventory.schemaVersion, 1);
assert.equal(manifest.schemaVersion, 1);

const allEntries = manifest.moves.filter((m) => m.stage === stage);
const moves = allEntries.filter((m) => !m.stable);
const stable = allEntries.filter((m) => m.stable);

assert.equal(allEntries.length, 50, 'Expected 50 G2 schema files');
assert.equal(moves.length, 38, 'Expected 38 G2 moves');
assert.equal(stable.length, 12, 'Expected 12 stable G2 files');

const origins = new Map(),
  destinations = new Map();

for (const m of moves) {
  assert(
    m.from.startsWith(prefix) && m.to.startsWith(prefix),
    `Outside schemas scope: ${m.from}`
  );

  assert(
    !m.from.includes('..') &&
      !m.to.includes('..') &&
      !m.to.includes('\\') &&
      m.from !== m.to,
    `Unsafe move: ${m.from}`
  );

  assert.equal(
    path.posix.basename(m.from),
    path.posix.basename(m.to),
    'G2 must not rename schemas'
  );

  assert(
    !origins.has(m.from) && !destinations.has(m.to),
    `Duplicate G2 mapping: ${m.from}`
  );

  origins.set(m.from, m.to);
  destinations.set(m.to, m.from);
}

const inventoryByPath = new Map(inventory.files.map((x) => [x.path, x]));

for (const m of allEntries) {
  assert(inventoryByPath.has(m.from), `No G0 inventory record: ${m.from}`);

  if (m.stable) {
    assert.equal(m.from, m.to);
    assert(existsSync(abs(m.from)), `Missing stable schema: ${m.from}`);
  }
}

const rawHash = (content) => createHash('sha256').update(content).digest('hex');

const hasMultilineTemplate = (content) =>
  (content.match(/`(?:\\.|[^`\\])*`/g) ?? []).some((x) => /[\r\n]/.test(x));

const sourceHash = (content) =>
  createHash('sha256')
    .update(
      content
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .filter(
          (line) =>
            line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
        )
        .join('\n')
    )
    .digest('hex');

const walk = (parent) => {
  const output = [];

  const visit = (p) => {
    if (!existsSync(abs(p))) return;

    for (const entry of readdirSync(abs(p), { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;

      const next = path.posix.join(p, entry.name);

      if (entry.isDirectory()) visit(next);
      else if (entry.isFile()) output.push(next);
    }
  };

  visit(parent);

  return output.sort();
};

const codeFiles = ['apps', 'packages', 'scripts']
  .flatMap(walk)
  .filter((x) => code.test(x));

const oldExists = (p) => existsSync(abs(p)) && statSync(abs(p)).isFile();

for (const m of moves)
  assert.notEqual(
    oldExists(m.from),
    oldExists(m.to),
    `Missing/duplicate original and target: ${m.from}`
  );

const done = moves.filter((m) => oldExists(m.to));

assert(
  done.length === 0 || done.length === 38,
  'Refuse partially relocated G2 tree'
);

if (mode === 'check') assert.equal(done.length, 38, 'G2 is not applied');

const projectedMoving =
  mode === 'check' ||
  mode === 'apply' ||
  (mode === 'dry-run' && done.length === 0);

const mapping = new Map(
  projectedMoving ? moves.map((m) => [m.from, m.to]) : []
);

const currentFiles = new Set(['apps', 'packages', 'scripts'].flatMap(walk));

const fromOriginal = (file) => destinations.get(file) ?? file;
const destination = (file) => mapping.get(fromOriginal(file)) ?? file;
const filesProjected = new Set([...currentFiles].map(destination));

const canonicalTarget = (file) =>
  mapping.get(destinations.get(file) ?? file) ?? file;

const candidate = (file, value) => {
  if (!value.startsWith('.')) return null;

  const base = path.posix
    .resolve('/', path.posix.dirname(file), value)
    .slice(1);

  for (const name of [
    base,
    ...extensions.map((e) => base + e),
    ...extensions.map((e) => path.posix.join(base, `index${e}`)),
  ]) {
    if (currentFiles.has(name)) return name;
  }

  return null;
};

const makeSpecifier = (from, target, original) => {
  let p = path.posix.relative(path.posix.dirname(from), target);

  if (!p.startsWith('.')) p = './' + p;

  if (!extensions.some((ext) => original.endsWith(ext)))
    p = p.replace(/\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|json)$/, '');

  return p;
};

const absoluteSchema = (value) =>
  value.replace(
    /(?:(?:apps\/api\/src\/|api\/src\/|src\/))?schemas\/([\w.-]+\.(?:ts|tsx|js|mjs|json))/g,
    (matched, file) => {
      const newPath = origins.get(`${prefix}${file}`);

      if (!newPath) return matched;

      const oldPrefix = matched.slice(
        0,
        matched.length - ('schemas/' + file).length
      );

      return oldPrefix + 'schemas/' + newPath.slice(prefix.length);
    }
  );

//===================================================================

function rewriteQuoted(value, from, to) {
  if (value.startsWith('.') && !value.includes('${')) {
    const target = candidate(from, value);

    if (target) {
      const mapped = canonicalTarget(target);

      if (mapped !== target || from !== to)
        return makeSpecifier(to, mapped, value);
    }
  }

  return absoluteSchema(value);
}

//===================================================================

function rewriteSegments(text) {
  // Preserve the known existing comma-separated paths in source checks.
  // 'schemas', 'auth.schema.ts' -> 'schemas', 'auth/auth.schema.ts'
  return text.replace(
    /(['"])schemas\1(\s*,\s*)(['"])([\w.-]+\.(?:ts|tsx|js|mjs|json))\3/g,
    (block, leftQuote, spacing, rightQuote, file) => {
      const mapped = origins.get(`${prefix}${file}`);

      if (!mapped) return block;

      return (
        leftQuote +
        'schemas' +
        leftQuote +
        spacing +
        rightQuote +
        mapped.slice(prefix.length) +
        rightQuote
      );
    }
  );
}

//===================================================================

function rewrite(text, from, to) {
  if (excludeSources.has(from)) return text;

  const replaced = text.replace(
    /(['"`])([^'"`\r\n]*)\1/g,
    (whole, quote, value) => {
      const mapped = rewriteQuoted(value, from, to);

      return mapped === value ? whole : quote + mapped + quote;
    }
  );

  return rewriteSegments(replaced);
}

//===================================================================

const predicted = new Map(),
  changed = [];

for (const file of codeFiles) {
  const to = destination(file);
  const before = readFileSync(abs(file), 'utf8');
  const after = rewrite(before, file, to);

  assert(!predicted.has(to), `Projected source collision: ${to}`);
  predicted.set(to, after);

  if (to !== file || before !== after)
    changed.push({ from: file, to, before, after });
}

// Also move the JSON contract fixture unchanged; do not edit JSON values.
for (const m of moves.filter((x) => !code.test(x.from))) {
  const current = done.length ? m.to : m.from;
  const next = projectedMoving ? m.to : current;

  if (current !== next)
    changed.push({
      from: current,
      to: next,
      before: readFileSync(abs(current)),
      after: readFileSync(abs(current)),
    });
}

// No unexpected flat schema file remains after relocation.
const flat = walk('apps/api/src/schemas').filter(
  (f) => path.posix.dirname(f) === 'apps/api/src/schemas'
);

for (const f of flat) assert(origins.has(f), `Unmapped flat G2 schema: ${f}`);

const imports =
  /\b(?:from\s*|import\s*\(\s*|import\s*|require\s*\(\s*)['"]([^'"\r\n]+)['"]/g;

//===================================================================

function resolvedProjected(file, spec) {
  const base = path.posix.resolve('/', path.posix.dirname(file), spec).slice(1);

  return (
    [
      base,
      ...extensions.map((e) => base + e),
      ...extensions.map((e) => path.posix.join(base, `index${e}`)),
    ].find((p) => filesProjected.has(p)) ?? null
  );
}

//===================================================================

let verified = 0;

const issues = [];

for (const file of codeFiles) {
  const original = readFileSync(abs(file), 'utf8');
  const after = predicted.get(destination(file));

  const originalImports = [...original.matchAll(imports)]
    .map((x) => x[1])
    .filter((x) => x.startsWith('.'));

  const afterImports = [...after.matchAll(imports)]
    .map((x) => x[1])
    .filter((x) => x.startsWith('.'));

  if (originalImports.length !== afterImports.length)
    issues.push(`Import count drift: ${file}`);

  for (let i = 0; i < originalImports.length; i++) {
    const before = candidate(file, originalImports[i]);
    const to = resolvedProjected(destination(file), afterImports[i]);

    if (before) {
      verified++;

      const expected = canonicalTarget(before);

      if (to !== expected)
        issues.push(
          `${file}: ${originalImports[i]} -> ${afterImports[i]} expected ${expected}, got ${to}`
        );
    }

    if (/\.tsx?$/.test(afterImports[i]) && !/\.tsx?$/.test(originalImports[i]))
      issues.push(`New .ts import: ${file}`);
  }
}

// Pinned pre-G2 hashes are captured from the supplied post-G1 archive.
// Pinned post-G2 hashes are produced in an isolated dry-run simulation and
// committed alongside this script, not regenerated during execution.
const expected = JSON.parse(readFileSync(abs(checksPath), 'utf8'));

assert.equal(expected.schemaVersion, 1);
assert.equal(expected.stage, stage);
assert.equal(Object.keys(expected.baselineHashes).length, 50);
assert.equal(Object.keys(expected.canonicalHashes).length, 50);

for (const entry of allEntries) {
  const current = done.length ? entry.to : entry.from;
  const original = readFileSync(abs(current));
  const baseline = expected.baselineHashes[entry.from];
  const canonical = expected.canonicalHashes[entry.to];

  assert(baseline && canonical, `Missing fixed G2 hash for ${entry.from}`);

  const actual = projectedMoving
    ? (predicted.get(entry.to) ?? original.toString('utf8'))
    : original.toString('utf8');

  const value = done.length ? canonical : baseline;

  if (
    hasMultilineTemplate(original.toString('utf8'))
      ? rawHash(original) !== value.raw
      : sourceHash(original.toString('utf8')) !== value.normalized
  )
    issues.push(`Changed existing G2 source: ${current}`);

  if (
    projectedMoving &&
    (hasMultilineTemplate(actual)
      ? rawHash(actual) !== canonical.raw
      : sourceHash(actual) !== canonical.normalized)
  )
    issues.push(
      `Changed projected G2 schema beyond approved paths: ${entry.to}`
    );
}

// Forbid new source references to old schemas in the resulting code files.
if (projectedMoving)
  for (const [file, content] of predicted) {
    if (excludeSources.has(file)) continue;

    for (const match of content.matchAll(
      /(?:apps\/api\/src\/|api\/src\/|src\/)?schemas\/([\w.-]+\.(?:ts|tsx|js|mjs|json))/g
    )) {
      if (origins.has(`${prefix}${match[1]}`))
        issues.push(`Obsolete flat schema path: ${file}: ${match[0]}`);
    }

    for (const match of content.matchAll(
      /(['"])schemas\1\s*,\s*(['"])([\w.-]+\.(?:ts|tsx|js|mjs|json))\2/g
    )) {
      if (origins.has(`${prefix}${match[3]}`))
        issues.push(`Obsolete segmented schema path: ${file}: ${match[3]}`);
    }
  }

if (issues.length)
  throw Error(
    `G2 preflight failed (${issues.length}):\n${issues.slice(0, 50).join('\n')}`
  );

if (mode === 'apply') {
  assert.equal(done.length, 0, 'G2 is already applied');

  // No writes happen until all collisions, imports and fingerprints have passed.
  for (const m of moves) {
    mkdirSync(abs(path.posix.dirname(m.to)), { recursive: true });
    renameSync(abs(m.from), abs(m.to));
  }

  for (const entry of changed)
    if (entry.before !== entry.after) writeFileSync(abs(entry.to), entry.after);
}

//===================================================================

process.stdout.write(
  JSON.stringify(
    {
      status: 'PASS',
      mode,
      stage,
      manifestEntries: moves.length,
      completedBeforeRun: done.length,
      selectedMoves: done.length ? 0 : moves.length,
      projectedMoved: projectedMoving ? 38 : done.length,
      touchedFiles: changed.length,

      rewrittenFileContents: changed.filter(
        (x) => typeof x.before === 'string' && x.after !== x.before
      ).length,

      verifiedRelativeImports: verified,
      obsoleteProxyFiles: 0,
    },
    null,
    2
  ) + '\n'
);
