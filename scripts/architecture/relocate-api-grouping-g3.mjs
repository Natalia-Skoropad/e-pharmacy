#!/usr/bin/env node
// G3: API operational scripts relocation. Preserve CLI names and filesystem semantics.
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
const stage = 'G3';
const prefix = 'apps/api/src/scripts/';
const mapPath = 'docs/architecture/grouping-g0/relocation-plan.json';
const inventoryPath = 'docs/architecture/grouping-g0/source-inventory.json';

const checksPath = 'docs/architecture/grouping-g3/source-fingerprints.json';

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
  // Historical stages must keep their frozen baseline paths.
  'scripts/architecture/api-grouping-g0-core.mjs',
  'scripts/architecture/check-api-grouping-g0.mjs',
  'scripts/architecture/check-api-grouping-g0.test.mjs',
  'scripts/architecture/relocate-api-grouping-g1.mjs',
  'scripts/architecture/relocate-api-grouping-g1.test.mjs',
  'scripts/architecture/relocate-api-grouping-g2.mjs',
  'scripts/architecture/relocate-api-grouping-g2.test.mjs',
  'scripts/architecture/relocate-api-grouping.mjs',
  'scripts/architecture/relocate-api-grouping-g3.mjs',
  'scripts/architecture/relocate-api-grouping-g3.test.mjs',
  // Self-contained relocation fixture from S1 must retain its original sample paths.
  'scripts/architecture/relocate-services-s1.test.mjs',
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
  assert.equal(arg[stageArg + 1], stage, 'Only --stage G3 is supported');

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

//===================================================================

// G3 cannot run against a mixed pre-G1 / pre-G2 working tree.
for (const prior of ['G1', 'G2']) {
  const pending = manifest.moves.filter((m) => m.stage === prior && !m.stable);

  assert(
    pending.every((m) => existsSync(abs(m.to)) && !existsSync(abs(m.from))),
    `Complete ${prior} before G3`
  );
}

const allEntries = manifest.moves.filter((m) => m.stage === stage);
const moves = allEntries.filter((m) => !m.stable);
const stable = allEntries.filter((m) => m.stable);

assert.equal(allEntries.length, 14, 'Expected 14 G3 scripts');
assert.equal(moves.length, 14, 'Expected 14 G3 moves');
assert.equal(stable.length, 0, 'Expected no stable G3 files');

const origins = new Map(),
  destinations = new Map();

for (const m of moves) {
  assert(
    m.from.startsWith(prefix) && m.to.startsWith(prefix),
    `Outside scripts scope: ${m.from}`
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
    'G3 must not rename scripts'
  );

  assert(
    !origins.has(m.from) && !destinations.has(m.to),
    `Duplicate G3 mapping: ${m.from}`
  );

  origins.set(m.from, m.to);
  destinations.set(m.to, m.from);
}

const inventoryByPath = new Map(inventory.files.map((x) => [x.path, x]));

for (const m of allEntries) {
  assert(inventoryByPath.has(m.from), `No G0 inventory record: ${m.from}`);

  if (m.stable) {
    assert.equal(m.from, m.to);
    assert(existsSync(abs(m.from)), `Missing stable script: ${m.from}`);
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
  done.length === 0 || done.length === 14,
  'Refuse partially relocated G3 tree'
);

if (mode === 'check') assert.equal(done.length, 14, 'G3 is not applied');

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

//===================================================================

// Rewrite *known* original script filenames only, preserving historical
// baselines and unrelated repository tooling under scripts/.
const oldScriptNames = [...origins.keys()].map((x) => x.slice(prefix.length));

const escapedNames = oldScriptNames.map((x) =>
  x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

const scriptLiteral = new RegExp(
  `(?:(?:apps/api/src/|api/src/|src/))?scripts/(${escapedNames.join('|')})(?![\\w.-])`,
  'g'
);

const absoluteScript = (value) =>
  value.replace(scriptLiteral, (matched, filename) => {
    const mapped = origins.get(prefix + filename);

    const before = matched.slice(
      0,
      matched.length - ('scripts/' + filename).length
    );

    return before + 'scripts/' + mapped.slice(prefix.length);
  });

//===================================================================

// The remaining two scripts use runtime __dirname to locate API-root data.
// Moving them one directory deeper must not change their lookup destinations.
function preserveFilesystemRoots(text, from) {
  if (from === prefix + 'copy-templates.mjs') {
    const old = "const apiRoot = resolve(__dirname, '..', '..');";

    assert(text.includes(old), 'Template copy root changed unexpectedly');

    return text.replace(
      old,
      "const apiRoot = resolve(__dirname, '..', '..', '..');"
    );
  }

  if (from === prefix + 'seed.ts') {
    const old = "path.resolve(__dirname, '..', '..', 'public', value.slice(1))";

    assert(
      text.includes(old),
      'Demo seed public assets root changed unexpectedly'
    );

    return text.replace(
      old,
      "path.resolve(__dirname, '..', '..', '..', 'public', value.slice(1))"
    );
  }

  return text;
}

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

  return absoluteScript(value);
}

//===================================================================

function rewriteSegments(text) {
  // Existing source checks sometimes construct paths from a segment array.
  return text.replace(
    /(['"])scripts\1(\s*,\s*)(['"])([\w.-]+\.(?:ts|tsx|js|mjs|json))\3/g,
    (block, leftQuote, spacing, rightQuote, filename) => {
      const mapped = origins.get(prefix + filename);

      if (!mapped) return block;

      return `${leftQuote}scripts${leftQuote}${spacing}${rightQuote}${mapped.slice(prefix.length)}${rightQuote}`;
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

  return preserveFilesystemRoots(rewriteSegments(replaced), from);
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

//===================================================================

// Non-code moves are supported for future manifests; G3 currently has none.
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

//===================================================================

// No unexpected flat script file remains after relocation.
const flat = walk('apps/api/src/scripts').filter(
  (f) => path.posix.dirname(f) === 'apps/api/src/scripts'
);

for (const f of flat) assert(origins.has(f), `Unmapped flat G3 script: ${f}`);

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

//===================================================================

// G4 has an exact, separately pinned post-relocation hash for the one G3
// operational script whose type-only import path changes. G3's historical
// pre/post fingerprints themselves remain untouched.
const g4TypeMoves = manifest.moves.filter((item) => item.stage === 'G4');

assert.equal(g4TypeMoves.length, 23, 'Missing immutable G4 grouping map');

const g4Finished = g4TypeMoves.every(
  (item) => existsSync(abs(item.to)) && !existsSync(abs(item.from))
);

const g4Pending = g4TypeMoves.every(
  (item) => existsSync(abs(item.from)) && !existsSync(abs(item.to))
);

assert(g4Finished || g4Pending, 'Partially relocated G4 types are forbidden');

const approvedG4Path =
  'docs/architecture/grouping-g4/approved-g3-after-g4.json';

const approvedG4 = g4Finished
  ? JSON.parse(readFileSync(abs(approvedG4Path), 'utf8')).files
  : {};

assert.deepEqual(
  Object.keys(approvedG4),
  g4Finished ? ['apps/api/src/scripts/seeds/seed.ts'] : []
);

const g5UtilMoves = manifest.moves.filter(
  (item) => item.stage === 'G5' && !item.stable
);

assert.equal(g5UtilMoves.length, 30);

const g5Finished = g5UtilMoves.every(
  (item) => existsSync(abs(item.to)) && !existsSync(abs(item.from))
);

const g5Pending = g5UtilMoves.every(
  (item) => existsSync(abs(item.from)) && !existsSync(abs(item.to))
);

assert(
  g5Finished || g5Pending,
  'Partially relocated G5 utilities are forbidden'
);

const approvedG5 = g5Finished
  ? JSON.parse(
      readFileSync(
        abs('docs/architecture/grouping-g5/approved-g3-after-g5.json'),
        'utf8'
      )
    ).files
  : {};

assert.deepEqual(
  Object.keys(approvedG5).sort(),

  g5Finished
    ? [
        'apps/api/src/scripts/diagnostics/diagnose-pharmacy-owner-registration-documents.ts',
        'apps/api/src/scripts/maintenance/cleanup-expired-cart-items.ts',
        'apps/api/src/scripts/migrations/owners/migrate-pharmacy-owner-foundation.ts',
        'apps/api/src/scripts/seeds/seed-admin-owner.ts',
        'apps/api/src/scripts/seeds/seed.ts',
      ]
    : []
);

const approvedG3SourceHash = (source, expected, ...alternatives) => {
  const usesRaw = hasMultilineTemplate(source);
  const key = usesRaw ? 'raw' : 'normalized';
  const actual = usesRaw ? rawHash(source) : sourceHash(source);

  return (
    actual === expected[key] ||
    alternatives.some(
      (alternative) => alternative !== undefined && actual === alternative[key]
    )
  );
};

//===================================================================

// Pinned G3 before/after hashes are calculated from the supplied post-G2 archive,
// not regenerated when users run relocation. Intentional path-depth patches
// for copy-templates and demo seed are part of canonical G3 fingerprints.
const expected = JSON.parse(readFileSync(abs(checksPath), 'utf8'));

assert.equal(expected.schemaVersion, 1);
assert.equal(expected.stage, stage);
assert.equal(Object.keys(expected.baselineHashes).length, 14);
assert.equal(Object.keys(expected.canonicalHashes).length, 14);

for (const entry of allEntries) {
  const current = done.length ? entry.to : entry.from;
  const original = readFileSync(abs(current));
  const baseline = expected.baselineHashes[entry.from];
  const canonical = expected.canonicalHashes[entry.to];

  assert(baseline && canonical, `Missing fixed G3 hash for ${entry.from}`);

  const actual = projectedMoving
    ? (predicted.get(entry.to) ?? original.toString('utf8'))
    : original.toString('utf8');

  const value = done.length ? canonical : baseline;

  if (
    !approvedG3SourceHash(
      original.toString('utf8'),
      value,
      approvedG4[current],
      approvedG5[current]
    )
  )
    issues.push(`Changed existing G3 source: ${current}`);

  if (
    projectedMoving &&
    !approvedG3SourceHash(
      actual,
      canonical,
      approvedG4[entry.to],
      approvedG5[entry.to]
    )
  )
    issues.push(
      `Changed projected G3 script beyond approved paths: ${entry.to}`
    );
}

//===================================================================

// Protect live source files against old script paths. Archived architecture
// maps, fixtures and documentation are intentionally historical.
if (projectedMoving) {
  const obsolete = new RegExp(scriptLiteral.source, 'g');

  for (const [file, content] of predicted) {
    if (excludeSources.has(file)) continue;

    for (const match of content.matchAll(obsolete)) {
      issues.push(`Obsolete flat script path: ${file}: ${match[0]}`);
    }
  }
}

//===================================================================

// Executable commands are a public operational API: retain all names, flags,
// wrappers and options. Change only exact source-script paths.
const commands = JSON.parse(
  readFileSync(
    abs('docs/architecture/grouping-g0/script-entrypoints.json'),
    'utf8'
  )
).commands;

const apiPackagePath = 'apps/api/package.json';
const beforePackage = readFileSync(abs(apiPackagePath), 'utf8');
const parsedPackage = JSON.parse(beforePackage);
const packageComplete = done.length === 14;

assert.equal(commands.length, 14, 'Expected 14 operational commands');

let afterPackage = beforePackage;

for (const entry of commands) {
  const sourceFilename = entry.target.slice(prefix.length);
  const canonical = origins.get(entry.target);

  assert(canonical, `Unknown executable script entrypoint: ${entry.target}`);

  const oldToken = `src/scripts/${sourceFilename}`;
  const newToken = `src/scripts/${canonical.slice(prefix.length)}`;
  const actual = parsedPackage.scripts[entry.command];

  const expected = packageComplete
    ? entry.executable.replace(oldToken, newToken)
    : entry.executable;

  assert.equal(actual, expected, `Operational script drift: ${entry.command}`);
  assert(actual.includes(packageComplete ? newToken : oldToken));

  if (projectedMoving && done.length === 0) {
    const from = JSON.stringify(entry.executable);
    const to = JSON.stringify(entry.executable.replace(oldToken, newToken));

    assert(
      afterPackage.includes(from),
      `Package command missing: ${entry.command}`
    );

    afterPackage = afterPackage.replace(from, to);
  }
}

if (projectedMoving) {
  const updated = JSON.parse(afterPackage);

  assert.deepEqual(
    Object.keys(updated.scripts),
    Object.keys(parsedPackage.scripts),
    'Operational command names changed'
  );
}

if (issues.length)
  throw Error(
    `G3 preflight failed (${issues.length}):\n${issues.slice(0, 50).join('\n')}`
  );

if (mode === 'apply') {
  assert.equal(done.length, 0, 'G3 is already applied');

  // No writes happen until all collisions, imports and fingerprints have passed.
  for (const m of moves) {
    mkdirSync(abs(path.posix.dirname(m.to)), { recursive: true });
    renameSync(abs(m.from), abs(m.to));
  }

  for (const entry of changed)
    if (entry.before !== entry.after) writeFileSync(abs(entry.to), entry.after);

  if (beforePackage !== afterPackage)
    writeFileSync(abs(apiPackagePath), afterPackage);
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
      projectedMoved: projectedMoving ? 14 : done.length,
      touchedFiles: changed.length,

      rewrittenFileContents: changed.filter(
        (x) => typeof x.before === 'string' && x.after !== x.before
      ).length,

      verifiedRelativeImports: verified,
      obsoleteProxyFiles: 0,
      preservedCommandNames: commands.length,
      commandFileRewritten: beforePackage !== afterPackage,
    },
    null,
    2
  ) + '\n'
);
