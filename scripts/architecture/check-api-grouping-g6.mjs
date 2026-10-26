#!/usr/bin/env node
// G6 final, read-only verification of canonical API grouping and dependency graph.
// This does not rewrite sources, run operational migrations, or edit G0–G5 baselines.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanSources, scriptCommands } from './api-grouping-g0-core.mjs';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const abs = (root, p) => path.join(root, p);
const json = (root, p) => JSON.parse(readFileSync(abs(root, p), 'utf8'));
const sha = (value) => createHash('sha256').update(value).digest('hex');

export const normalized = (text) =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

export const EXPECTED = Object.freeze({
  G1: [35, 35],
  G2: [50, 38],
  G3: [14, 14],
  G4: [23, 23],
  G5: [31, 30],
});

const dirs = ['constants', 'schemas', 'scripts', 'types', 'utils'];
const stageNames = ['G1', 'G2', 'G3', 'G4', 'G5'];

const skip = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'coverage',
  '.artifacts',
]);

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

// Static literal specifiers; generated dynamic paths are additionally covered by build/tests.
const imported =
  /\b(?:from\s*|import\s*\(\s*|import\s*|require\s*\(\s*)['"]([^'"\r\n]+)['"]/g;

//===================================================================

export function walk(root, dir, predicate = () => true) {
  const files = [];

  function visit(rel) {
    if (!existsSync(abs(root, rel))) return;

    for (const e of readdirSync(abs(root, rel), { withFileTypes: true })) {
      if (skip.has(e.name)) continue;

      const next = path.posix.join(rel, e.name);

      if (e.isDirectory()) visit(next);
      else if (e.isFile() && predicate(next)) files.push(next);
    }
  }

  visit(dir);

  return files.sort();
}

//===================================================================

// Kept pure so unit tests can inject a missing file, a path collision or a
// corrupted inventory without mutating the user's repository.
export function verifyLayout({ moves, files, fileExists, sourcePaths }) {
  const errors = [];

  const seenFrom = new Set(),
    seenTo = new Set();

  const actual = new Set(sourcePaths);
  const expectedPaths = new Set();
  const counts = {};
  const inventory = new Map(files.map((x) => [x.path, x]));

  if (moves.length !== 153 || files.length !== 153)
    errors.push('G0 count must stay exactly 153');

  if (inventory.size !== 153) errors.push('Duplicate G0 inventory paths');

  for (const stage of stageNames) {
    const rows = moves.filter((m) => m.stage === stage);
    const moved = rows.filter((m) => !m.stable);

    counts[stage] = {
      files: rows.length,
      relocated: moved.length,
      stable: rows.length - moved.length,
    };

    if (
      rows.length !== EXPECTED[stage][0] ||
      moved.length !== EXPECTED[stage][1]
    )
      errors.push(`${stage} manifest count differs from immutable G0`);
  }

  for (const m of moves) {
    if (seenFrom.has(m.from) || seenTo.has(m.to))
      errors.push(`Duplicate map key: ${m.from}`);

    seenFrom.add(m.from);
    seenTo.add(m.to);

    const item = inventory.get(m.from);

    if (!item || item.stage !== m.stage)
      errors.push(`Missing/mismatched G0 inventory: ${m.from}`);

    const folder = dirs[stageNames.indexOf(m.stage)];
    const base = `apps/api/src/${folder}/`;

    if (
      !m.from.startsWith(base) ||
      !m.to.startsWith(base) ||
      m.to.includes('..') ||
      m.to.includes('\\') ||
      m.to.includes('//') ||
      path.posix.basename(m.from) !== path.posix.basename(m.to)
    )
      errors.push(`Unsafe or noncanonical move: ${m.from}`);

    if (m.stable !== (m.from === m.to))
      errors.push(`Stable state mismatch: ${m.from}`);

    if (!fileExists(m.to)) errors.push(`Missing final target: ${m.to}`);

    if (!m.stable && fileExists(m.from))
      errors.push(`Legacy flat path/proxy still exists: ${m.from}`);
    expectedPaths.add(m.to);
  }

  for (const expected of expectedPaths)
    if (!actual.has(expected))
      errors.push(`Canonical file not found in grouping tree: ${expected}`);

  for (const file of actual)
    if (!expectedPaths.has(file))
      errors.push(`Unplanned file in grouping tree: ${file}`);

  return { errors, counts };
}

//===================================================================

export function resolveRelative(root, from, spec) {
  if (!spec.startsWith('.')) return null;

  const base = path.resolve(path.dirname(abs(root, from)), spec);

  const variants = [
    base,
    ...extensions.map((ext) => base + ext),
    ...extensions.map((ext) => path.join(base, `index${ext}`)),
  ];

  for (const candidate of variants) {
    if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;

    const relative = path.relative(root, candidate).split(path.sep).join('/');

    if (!relative.startsWith('../') && !path.isAbsolute(relative))
      return relative;
  }

  return null;
}

//===================================================================

// Literal import references in architecture unit tests are fixture strings, not
// live imports; Next.js creates next-env.d.ts routes only after next typegen.
const isSynthetic = (file) =>
  /^(?:apps\/(?:admin|client|pharmacy)\/next-env\.d\.ts)$/.test(file) ||
  /^scripts\/architecture\/[^/]+\.test\.mjs$/.test(file);

//===================================================================

export function scanAllRelative(root) {
  const candidates = ['apps', 'packages', 'scripts'].flatMap((dir) =>
    walk(root, dir, (f) => code.test(f) && !isSynthetic(f))
  );

  const unresolved = [];

  let checked = 0;

  for (const file of candidates) {
    const value = readFileSync(abs(root, file), 'utf8');

    imported.lastIndex = 0;

    for (const match of value.matchAll(imported)) {
      if (!match[1].startsWith('.')) continue;

      checked++;

      if (!resolveRelative(root, file, match[1]))
        unresolved.push(`${file}: ${match[1]}`);
    }
  }

  return { checked, unresolved, scanned: candidates.length };
}

//===================================================================

export function checkSourceRefs(scan, manifest) {
  const old = manifest.filter((m) => !m.stable).map((m) => m.from);
  const stale = [];

  for (const ref of scan.literalSourcePaths) {
    if (ref.file.startsWith('scripts/architecture/')) continue; // immutable history/fixtures

    if (old.some((p) => p.endsWith(ref.value) || ref.value.endsWith(p)))
      stale.push(`${ref.file}:${ref.line} ${ref.value}`);
  }

  return stale;
}

//===================================================================

function verifyCli(root, manifest, source) {
  const errors = [];

  const before = json(
    root,
    'docs/architecture/grouping-g0/script-entrypoints.json'
  ).commands;

  const after = scriptCommands();
  const mapped = new Map(manifest.map((m) => [m.from, m.to]));

  if (before.length !== 14 || after.length !== 14)
    errors.push('Expected 14 G3 CLI command references');
  const current = new Map(after.map((x) => [`${x.file}:${x.command}`, x]));

  for (const cmd of before) {
    const expected = mapped.get(cmd.target);
    const value = current.get(`${cmd.file}:${cmd.command}`);

    if (!value || value.target !== expected || !value.targetExists)
      errors.push(`Missing CLI target: ${cmd.command}`);

    if (
      value &&
      (!source.has(value.target) ||
        /src\/scripts\/[^/]+\.(?:ts|js|mjs)$/.test(value.target))
    )
      errors.push(`Noncanonical G3 CLI: ${cmd.command}`);
  }

  return errors;
}

//===================================================================

// Independent hash gate: allow a test to substitute a corrupted pin without
// modifying any archived source. Both raw and normalized hashes must match.
export function verifyPinnedSources({ moves, hashes, fileExists, readBytes }) {
  const errors = [];
  const expected = new Set(moves.map((m) => m.to));

  if (Object.keys(hashes).length !== expected.size)
    errors.push('Incomplete G6 final hashes');

  for (const key of Object.keys(hashes))
    if (!expected.has(key)) errors.push(`Unexpected G6 fingerprint: ${key}`);

  for (const item of moves) {
    if (!fileExists(item.to)) continue;

    const entry = hashes[item.to];

    if (!entry) {
      errors.push(`No G6 fingerprint: ${item.to}`);
      continue;
    }

    const bytes = readBytes(item.to);

    if (
      entry.raw !== sha(bytes) ||
      entry.normalized !== sha(normalized(bytes.toString('utf8')))
    )
      errors.push(`Source fingerprint drift: ${item.to}`);
  }

  return errors;
}

//===================================================================

export function runAudit(root = ROOT) {
  const manifest = json(
    root,
    'docs/architecture/grouping-g0/relocation-plan.json'
  );

  const inventory = json(
    root,
    'docs/architecture/grouping-g0/source-inventory.json'
  );

  const pinned = json(
    root,
    'docs/architecture/grouping-g6/canonical-source-fingerprints.json'
  );

  const approval = json(
    root,
    'docs/architecture/grouping-g6/approved-g5-formatting.json'
  );

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(pinned.schemaVersion, 1);
  assert.equal(approval.schemaVersion, 1);
  assert.equal(pinned.stage, 'G6');
  assert.equal(approval.stage, 'G6');

  const paths = dirs.flatMap((d) => walk(root, `apps/api/src/${d}`));
  const source = new Set(paths);

  const layout = verifyLayout({
    moves: manifest.moves,
    files: inventory.files,
    fileExists: (f) =>
      existsSync(abs(root, f)) && statSync(abs(root, f)).isFile(),
    sourcePaths: paths,
  });

  const issues = [...layout.errors];

  issues.push(
    ...verifyPinnedSources({
      moves: manifest.moves,
      hashes: pinned.hashes,
      fileExists: (f) => source.has(f),
      readBytes: (f) => readFileSync(abs(root, f)),
    })
  );

  const approvedNames = [
    'apps/api/src/utils/email/passwordResetEmail.ts',
    'apps/api/src/utils/email/sendEmail.ts',
  ];

  if (
    JSON.stringify(Object.keys(approval.files).sort()) !==
    JSON.stringify(approvedNames)
  )
    issues.push(
      'G6 formatting approvals must contain exactly two reviewed email modules'
    );

  const g5Pins = json(
    root,
    'docs/architecture/grouping-g5/source-fingerprints.json'
  );

  for (const [file, record] of Object.entries(approval.files)) {
    if (
      JSON.stringify(record.previousG5) !==
        JSON.stringify(g5Pins.canonicalHashes[file]) ||
      JSON.stringify(record.approvedAfterG5) !==
        JSON.stringify(pinned.hashes[file])
    )
      issues.push(
        `G6 formatting approval does not match prior and final pins: ${file}`
      );
  }

  const relative = scanAllRelative(root);

  issues.push(
    ...relative.unresolved.map((item) => `Unresolved relative import: ${item}`)
  );

  const graph = scanSources();

  if (graph.counts.apiImportCycles)
    issues.push(
      ...graph.apiImportCycles.map((x) => `API import cycle: ${x.join(' -> ')}`)
    );

  if (graph.counts.unresolvedTrackedRelativeImports)
    issues.push('Grouped relative imports unresolved');

  issues.push(
    ...checkSourceRefs(graph, manifest.moves).map(
      (x) => `Obsolete literal path: ${x}`
    )
  );

  issues.push(...verifyCli(root, manifest.moves, source));

  const express = manifest.moves.find(
    (m) => m.from === 'apps/api/src/types/express.ts'
  );

  if (
    !express ||
    !readFileSync(abs(root, express.to), 'utf8').includes(
      "declare module 'express'"
    )
  )
    issues.push('Express.Request module augmentation disappeared');

  return {
    status: issues.length ? 'FAIL' : 'PASS',
    mode: 'check',
    stage: 'G6',
    inventoryFiles: manifest.moves.length,
    relocatedFiles: manifest.moves.filter((m) => !m.stable).length,
    stableFiles: manifest.moves.filter((m) => m.stable).length,
    stages: layout.counts,
    scannedCodeFiles: relative.scanned,
    verifiedRelativeImports: relative.checked,
    unresolvedRelativeImports: relative.unresolved.length,
    apiImportEdges: graph.counts.totalApiImportEdges,
    apiImportCycles: graph.counts.apiImportCycles,
    obsoleteLiteralPaths: checkSourceRefs(graph, manifest.moves).length,
    preservedCommandNames: scriptCommands().length,
    reviewedPostG5Formatting: Object.keys(approval.files).length,
    errors: issues,
  };
}

//===================================================================

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert.deepEqual(
    process.argv.slice(2),
    ['--check'],
    'G6 accepts --check only; it never modifies files'
  );

  const result = runAudit();
  console.log(JSON.stringify(result, null, 2));

  if (result.status !== 'PASS') process.exitCode = 1;
}
