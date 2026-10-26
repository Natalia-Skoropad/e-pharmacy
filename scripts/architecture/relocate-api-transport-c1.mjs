#!/usr/bin/env node
// C1 tool: read-only plan, then C2–C6 relocate API transport modules by domain.
// All paths are rooted at this repository, never in the caller's cwd.
import assert from 'node:assert/strict';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const MANIFEST = 'docs/architecture/transport-c1/transport-relocation-map.json';

//===================================================================

// Regression tests intentionally contain OLD flat transport paths as fixtures.
// Keep their literals stable across all C2-C6 apply runs.
const RELOCATION_TEST_FIXTURE =
  'scripts/architecture/relocate-api-transport-c1.test.mjs';

const SCOPES = [
  'apps/api/src/controllers/',
  'apps/api/src/routes/',
  'apps/api/src/middlewares/',
];

const EXCLUDED = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  'coverage',
  '.artifacts',
]);

const CODE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const args = process.argv.slice(2);

const mode = args.includes('--apply')
  ? 'apply'
  : args.includes('--dry-run')
    ? 'dry-run'
    : args.includes('--check')
      ? 'check'
      : 'plan';

const stageIndex = args.indexOf('--stage');
const stage = stageIndex === -1 ? null : args[stageIndex + 1];

//===================================================================

if (stage && !/^C[2-6]$/.test(stage))
  throw Error('--stage must be C2, C3, C4, C5, or C6');

if (
  args.filter((a) => ['--apply', '--dry-run', '--plan', '--check'].includes(a))
    .length > 1
)
  throw Error('Use only one mode');

if (
  args.some(
    (a, i) =>
      !['--apply', '--dry-run', '--plan', '--check', '--stage'].includes(a) &&
      i !== stageIndex + 1
  )
)
  throw Error('Unknown arguments');

if (mode === 'apply' && !stage)
  throw Error('Physical relocation requires --stage C2..C6');

//===================================================================

const manifest = JSON.parse(readFileSync(path.join(ROOT, MANIFEST), 'utf8'));

assert.equal(manifest.schemaVersion, 1);
assert.deepEqual(manifest.scope, SCOPES);

const moves = manifest.moves;
const origin = new Map();
const destination = new Map();

const safe = (file) =>
  !path.isAbsolute(file) &&
  !file.split('/').includes('..') &&
  SCOPES.some((scope) => file.startsWith(scope));

for (const entry of moves) {
  assert(
    safe(entry.from) && safe(entry.to),
    `Unsafe relocation: ${JSON.stringify(entry)}`
  );

  assert(
    !origin.has(entry.from) && !destination.has(entry.to),
    `Duplicate relocation: ${entry.from}`
  );

  assert(entry.from !== entry.to, `No-op relocation: ${entry.from}`);
  assert(/^C[2-6]$/.test(entry.stage), `Invalid stage for ${entry.from}`);
  origin.set(entry.from, entry);
  destination.set(entry.to, entry);
}

//===================================================================

const abs = (p) => path.join(ROOT, p);
const norm = (p) => p.replaceAll('\\', '/');
const isFile = (p) => existsSync(abs(p));

const relocatedDestinationExists = isFile;

const inventory = SCOPES.flatMap((scope) =>
  readdirSync(abs(scope), { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.ts'))
    .map((d) => scope + d.name)
    .filter((p) => !manifest.stableEntryPoints.includes(p))
);

for (const file of inventory)
  assert(origin.has(file), `Unmapped top-level transport module: ${file}`);

for (const move of moves) {
  const oldExists = isFile(move.from);
  const newExists = relocatedDestinationExists(move.to);

  assert(
    oldExists !== newExists,
    `Expected exactly one location for ${move.from}`
  );
}

//===================================================================

const completed = new Set(
  moves.filter((m) => relocatedDestinationExists(m.to)).map((m) => m.from)
);

//===================================================================

// Refuse to relocate later domains before the earlier stages are complete.
if (mode === 'apply') {
  const selectedNumber = Number(stage.slice(1));

  for (const move of moves) {
    if (Number(move.stage.slice(1)) < selectedNumber)
      assert(
        completed.has(move.from),
        `Previous stage ${move.stage} is incomplete`
      );
  }
}

const selected = moves.filter(
  (m) => (!stage || m.stage === stage) && !completed.has(m.from)
);

const moved = new Map(
  moves
    .filter(
      (m) =>
        completed.has(m.from) ||
        (stage && m.stage === stage && mode !== 'check')
    )
    .map((m) => [m.from, m.to])
);

//===================================================================

// --check verifies current disk and never assumes the selected stage has run.
if (mode === 'check') {
  moved.clear();
  for (const move of moves)
    if (completed.has(move.from)) moved.set(move.from, move.to);
}

//===================================================================

function walk(dir) {
  const found = [];

  for (const e of readdirSync(abs(dir), { withFileTypes: true })) {
    if (EXCLUDED.has(e.name)) continue;

    const child = norm(path.posix.join(dir, e.name));

    if (e.isDirectory()) found.push(...walk(child));
    else if (e.isFile() && CODE.test(e.name)) found.push(child);
  }

  return found;
}

//===================================================================

const files = ['apps', 'packages', 'scripts'].flatMap((d) => walk(d));
const currentFile = (p) => destination.get(p)?.from ?? p;

//===================================================================

function mappedPath(p) {
  return moved.get(p) ?? p;
}

//===================================================================

function candidate(file, suffix) {
  const root = path.posix
    .resolve('/', path.posix.dirname(file), suffix)
    .slice(1);

  const candidates = [
    root,
    ...['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'].map(
      (x) => root + x
    ),

    ...['.ts', '.tsx', '.js', '.mjs'].map((x) => root + '/index' + x),
  ];

  return (
    candidates.find((p) => isFile(p) || origin.has(p) || destination.has(p)) ??
    null
  );
}

//===================================================================

function relativeSpecifier(from, to, originalLiteral) {
  let relative = path.posix.relative(path.posix.dirname(from), to);

  if (!relative.startsWith('.')) relative = './' + relative;

  const oldNoExt = !/\.(?:ts|tsx|mts|cts|js|mjs|cjs|json)$/.test(
    originalLiteral
  );

  if (oldNoExt)
    relative = relative.replace(/\.(?:ts|tsx|mts|cts|js|mjs|cjs|json)$/, '');

  return relative;
}

//===================================================================

// Match literal source-path references; replace only mapped concrete filenames.
function sourceLiteral(value) {
  return value.replace(
    /(?:apps\/api\/src\/|src\/)?(controllers|routes|middlewares)\/([\w.-]+\.ts)/g,
    (whole, domain, filename) => {
      const original = `apps/api/src/${domain}/${filename}`;
      const target = moved.get(original);

      if (!target) return whole;

      // Preserve the original prefix (apps/api/src/, src/, or bare domain/).
      const prefix = whole.slice(
        0,
        whole.length - domain.length - filename.length - 1
      );

      return prefix + target.slice('apps/api/src/'.length);
    }
  );
}

//===================================================================

// A quoted relative source-path can be an import OR read(__dirname,'../...').
// Resolve against the source's OLD location and rewrite when it targets a file.
function rewriteLiteral(value, from, to) {
  if (value.startsWith('.') && !value.includes('${')) {
    const target = candidate(from, value);

    if (target) {
      const oldTarget = destination.get(target)?.from ?? target;
      const nextTarget = moved.get(oldTarget) ?? target;

      if (nextTarget !== target || from !== to)
        return relativeSpecifier(to, nextTarget, value);
    }
  }

  return sourceLiteral(value);
}

//===================================================================

function rewriteSegments(source) {
  // Handles path.join('apps', 'api', 'src', 'controllers', 'foo.ts').
  return source.replace(
    /(['"`])([\w.-]+)\1(\s*,\s*(['"`])([\w.-]+)\4){1,12}/g,
    (block) => {
      const matches = [...block.matchAll(/(['"`])([\w.-]+)\1/g)];
      const tokens = matches.map((x) => x[2]);

      const index = tokens.findIndex((x) =>
        ['controllers', 'routes', 'middlewares'].includes(x)
      );

      if (index < 0 || index + 1 >= tokens.length) return block;

      const target = moved.get(
        `apps/api/src/${tokens[index]}/${tokens[index + 1]}`
      );

      if (!target) return block;

      const newToken = target.slice(`apps/api/src/${tokens[index]}/`.length);
      const matched = matches[index + 1];

      return (
        block.slice(0, matched.index) +
        matched[1] +
        newToken +
        matched[1] +
        block.slice(matched.index + matched[0].length)
      );
    }
  );
}

//===================================================================

// Keep quote styles, line endings and all non-path code verbatim. No proxy files.
function rewrite(content, from, to) {
  if (from === RELOCATION_TEST_FIXTURE) return content;

  let result = content.replace(
    /(['"`])((?:(?!\1)[^'"`\r\n])*)\1/g,
    (match, quote, value) => {
      const next = rewriteLiteral(value, from, to);

      return next === value ? match : quote + next + quote;
    }
  );

  result = rewriteSegments(result);

  return result;
}

//===================================================================

// Preflight all transformed code in-memory; stage applies only AFTER validation.
const changes = [];
const predicted = new Map();

for (const file of files) {
  const old = currentFile(file);
  const to = mappedPath(old);
  const before = readFileSync(abs(file), 'utf8');
  const after = rewrite(before, file, to);

  predicted.set(to, after);

  if (after !== before || to !== file)
    changes.push({ from: file, to, before, after });
}

//===================================================================

// Keep source-level HTTP method registrations, mount prefixes and order intact.
// Relocation is allowed to change only source references and import paths.
const registrations = (text) =>
  [
    ...text.matchAll(
      /\b[\w.]+\.(?:get|post|put|patch|delete|options|head)\s*\(/g
    ),
  ].map((match) => match[0]);

const routeLiterals = (text) =>
  [...text.matchAll(/(['"`])(\/[^'"`\r\n]*)\1/g)].map((match) => match[2]);

const mountPrefixes = (text) =>
  [...text.matchAll(/\broutes\.use\s*\(\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1]
  );

let registeredRouteMethods = 0;

for (const file of files.filter((p) => p.startsWith('apps/api/src/routes/'))) {
  const old = currentFile(file);
  const before = readFileSync(abs(file), 'utf8');
  const after = predicted.get(mappedPath(old));

  assert.deepEqual(
    registrations(after),
    registrations(before),
    `HTTP method registrations changed in ${file}`
  );

  assert.deepEqual(
    routeLiterals(after),
    routeLiterals(before),
    `Absolute route/URL literals changed in ${file}`
  );

  registeredRouteMethods += registrations(after).length;
}

const routeIndex = predicted.get('apps/api/src/routes/index.ts');

assert(routeIndex, 'Missing route composition root');

const registeredMounts = mountPrefixes(routeIndex).length;

assert.equal(
  registeredMounts,
  manifest.httpContracts.mounts,
  'API route mount count drift'
);

assert.equal(
  registeredRouteMethods,
  manifest.httpContracts.registrations,
  'API method registry count drift'
);

const rewrites = changes.filter((c) => c.before !== c.after).length;
const projected = new Set(files.map((f) => mappedPath(currentFile(f))));

//===================================================================

function resolveInSet(from, specifier, candidates) {
  const base = path.posix
    .resolve('/', path.posix.dirname(from), specifier)
    .slice(1);

  const variants = [
    base,
    ...['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'].map((ext) => base + ext),
    ...['.ts', '.tsx', '.js'].map((ext) => base + '/index' + ext),
  ];

  return variants.find((p) => candidates.has(p)) ?? null;
}

//===================================================================

function getImports(text) {
  const matches = [];

  const pattern =
    /\bfrom\s*['"]([^'"\r\n]+)['"]|\bimport\s*['"]([^'"\r\n]+)['"]|\b(?:import|require)\s*\(\s*['"]([^'"\r\n]+)['"]/g;

  for (const match of text.matchAll(pattern))
    matches.push(match[1] ?? match[2] ?? match[3]);

  return matches.filter((specifier) => specifier.startsWith('.'));
}

//===================================================================

let checkedImports = 0;

const currentFiles = new Set(files);
const importErrors = [];

for (const file of files) {
  const before = readFileSync(abs(file), 'utf8');
  const to = mappedPath(currentFile(file));
  const after = predicted.get(to);

  const beforeImports = getImports(before);
  const afterImports = getImports(after);

  assert.equal(
    afterImports.length,
    beforeImports.length,
    `Import count changed in ${file}`
  );

  for (let index = 0; index < beforeImports.length; index++) {
    const spec = beforeImports[index];
    const newSpec = afterImports[index];

    // C1 must never introduce an explicit .ts import, a regression caught at M1.
    if (/\.tsx?$/.test(newSpec) && !/\.tsx?$/.test(spec))
      importErrors.push(
        `${file}: unexpected TypeScript import extension ${newSpec}`
      );

    const originalTarget = resolveInSet(file, spec, currentFiles);

    if (!originalTarget) continue; // Pre-existing missing imports are out of scope.

    const oldTarget = destination.get(originalTarget)?.from ?? originalTarget;
    const expected = mappedPath(oldTarget);
    const result = resolveInSet(to, newSpec, projected);

    checkedImports++;

    if (result !== expected)
      importErrors.push(
        `${file} -> ${to}: ${spec} expected ${expected}, got ${result ?? '<unresolved>'}`
      );
  }
}

if (importErrors.length)
  throw Error(
    `C1 import resolution failed (${importErrors.length}):\n` +
      importErrors.slice(0, 40).join('\n')
  );

for (const move of selected) {
  if (mode !== 'check')
    assert(projected.has(move.to), `No projected destination for ${move.from}`);
}

//===================================================================

function verifyProjected() {
  const failures = [];
  const affected = new Set(moved.values());

  // Literal old transport file references are not allowed after relocation.
  const pathPattern =
    /(?:apps\/api\/src\/|src\/)?(controllers|routes|middlewares)\/([\w.-]+\.ts)/g;

  for (const [file, content] of predicted) {
    // This test file necessarily describes the pre-relocation source layout.
    if (file === RELOCATION_TEST_FIXTURE) continue;

    for (const x of content.matchAll(pathPattern)) {
      const target = `apps/api/src/${x[1]}/${x[2]}`;

      if (moved.has(target))
        failures.push(`${file}: obsolete source reference ${x[0]}`);
    }

    const strings = content.matchAll(/(['"`])([^'"`\r\n]*)\1/g);

    for (const q of strings) {
      if (!q[2].startsWith('.') || q[2].includes('${')) continue;

      const target = candidate(file, q[2]);
      // If a string names a moved module's former path, resolution must not use it.

      if (target && moved.has(target))
        failures.push(`${file}: obsolete relative reference ${q[2]}`);
    }
  }

  if (failures.length)
    throw Error(
      `C1 import/path gate failed (${failures.length}):\n` +
        failures.slice(0, 35).join('\n')
    );

  return affected.size;
}

//===================================================================

if (mode === 'check' || mode === 'dry-run' || mode === 'apply')
  verifyProjected();

if (mode === 'check' && stage) {
  const remaining = moves.filter(
    (m) => m.stage === stage && !completed.has(m.from)
  );

  if (remaining.length)
    throw Error(
      `${stage} has ${remaining.length} pending moves; --check --stage requires completed relocation`
    );
}

if (mode === 'apply') {
  // Move the sources first; fail-closed on collisions before any code is written.
  for (const move of selected)
    assert(!isFile(move.to), `Destination already exists: ${move.to}`);

  for (const move of selected) {
    mkdirSync(path.dirname(abs(move.to)), { recursive: true });
    renameSync(abs(move.from), abs(move.to));
  }

  for (const c of changes)
    if (c.before !== c.after) writeFileSync(abs(c.to), c.after, 'utf8');
}

//===================================================================

const report = {
  mode,
  stage: stage ?? 'all',
  manifestEntries: moves.length,
  completedBeforeRun: completed.size,
  selectedMoves: selected.length,
  touchedFiles: changes.length,
  rewrittenFileContents: rewrites,
  projectedMoved: moved.size,
  verifiedRelativeImports: checkedImports,
  routeMounts: registeredMounts,
  routeMethodRegistrations: registeredRouteMethods,
};

//===================================================================

console.log(JSON.stringify(report, null, 2));
