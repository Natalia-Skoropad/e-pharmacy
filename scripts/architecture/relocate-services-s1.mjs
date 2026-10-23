#!/usr/bin/env node
// S1 tool. S2-S8 are the only stages that physically relocate service files.
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

const MANIFEST = 'docs/architecture/services-s1/service-relocation-map.json';
const SCOPE = 'apps/api/src/services/';

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

if (stage && !/^S[2-8]$/.test(stage))
  throw Error('--stage must be S2, S3, S4, S5, S6, S7, or S8');

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
  throw Error('Physical relocation requires --stage S2..S8');

//===================================================================

const manifest = JSON.parse(readFileSync(path.join(ROOT, MANIFEST), 'utf8'));

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.scope, SCOPE);

const moves = manifest.moves;
const origin = new Map();
const destination = new Map();

const safe = (file) =>
  !path.isAbsolute(file) &&
  !file.split('/').includes('..') &&
  file.startsWith(SCOPE);

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
  assert(/^S[2-8]$/.test(entry.stage), `Invalid stage for ${entry.from}`);
  origin.set(entry.from, entry);
  destination.set(entry.to, entry);
}

//===================================================================

// Stage S10 replaces the already-relocated Order service with canonical domain modules.
// Preserve the historical S1 relocation ledger without retaining a proxy file.
const S10_REPLACEMENTS = new Map([
  // S10.7: Stock movement writes, legacy backfill, reconciliation and reads are separate.
  [
    'apps/api/src/services/inventory/stockMovement.service.ts',
    [
      'apps/api/src/services/inventory/stock-movement-types.ts',
      'apps/api/src/services/inventory/stock-movement-balance.ts',
      'apps/api/src/services/inventory/stock-movement-write.service.ts',
      'apps/api/src/services/inventory/stock-movement-legacy.service.ts',
      'apps/api/src/services/inventory/stock-movement-reconcile.service.ts',
      'apps/api/src/services/inventory/stock-movement-projection.ts',
      'apps/api/src/services/inventory/stock-movement-read.service.ts',
    ],
  ],
  // S10.6: Owner administration read paths are decomposed without a legacy facade.
  [
    'apps/api/src/services/admin/owners/admin-pharmacy-owner-read.service.ts',
    [
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-filters.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-registry.service.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-detail.service.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-pharmacies.service.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-activity.service.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-sales.service.ts',
      'apps/api/src/services/admin/owners/admin-pharmacy-owner-sessions.service.ts',
    ],
  ],
  // S10.5: Product Request reads, mutations and moderation use direct canonical owners.
  [
    'apps/api/src/services/catalog/product-request.service.ts',
    [
      'apps/api/src/services/catalog/product-request-read.service.ts',
      'apps/api/src/services/catalog/product-request-management.service.ts',
      'apps/api/src/services/catalog/product-request-moderation.service.ts',
      'apps/api/src/services/catalog/product-request-access.ts',
      'apps/api/src/services/catalog/product-request-articles.ts',
      'apps/api/src/services/catalog/product-request-projection.ts',
    ],
  ],
  // S10.4: Auth register/login/sessions/password/profile have canonical owners.
  [
    'apps/api/src/services/auth/auth.service.ts',
    [
      'apps/api/src/services/auth/auth-register.service.ts',
      'apps/api/src/services/auth/auth-login.service.ts',
      'apps/api/src/services/auth/auth-sessions.service.ts',
      'apps/api/src/services/auth/auth-password.service.ts',
      'apps/api/src/services/auth/auth-profile.service.ts',
      'apps/api/src/services/auth/auth-session-tokens.ts',
      'apps/api/src/services/auth/auth-user-fields.ts',
    ],
  ],
  // S10.3: Product public reads, management and reviews use canonical modules.
  [
    'apps/api/src/services/catalog/product.service.ts',
    [
      'apps/api/src/services/catalog/product-public.service.ts',
      'apps/api/src/services/catalog/product-management.service.ts',
      'apps/api/src/services/catalog/product-reviews.service.ts',
      'apps/api/src/services/catalog/product-projections.ts',
      'apps/api/src/services/catalog/product-shared.ts',
      'apps/api/src/services/catalog/product-management-access.ts',
    ],
  ],
  // S10.2: Pharmacy responsibilities are now canonical modules, not a proxy.
  [
    'apps/api/src/services/pharmacies/pharmacy.service.ts',
    [
      'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts',
      'apps/api/src/services/pharmacies/pharmacy-reviews.service.ts',
      'apps/api/src/services/pharmacies/pharmacy-owner-profile.service.ts',
      'apps/api/src/services/pharmacies/pharmacy-moderation.service.ts',
      'apps/api/src/services/pharmacies/pharmacy-profile.shared.ts',
      'apps/api/src/services/pharmacies/pharmacy-public-status.ts',
    ],
  ],
  [
    'apps/api/src/services/orders/order.service.ts',
    [
      'apps/api/src/services/orders/order-checkout.service.ts',
      'apps/api/src/services/orders/order-manager-orders.service.ts',
      'apps/api/src/services/orders/order-mutations.service.ts',
      'apps/api/src/services/orders/order-comments.service.ts',
      'apps/api/src/services/orders/order-query.service.ts',
      'apps/api/src/services/orders/order-sales-statistics.service.ts',
      'apps/api/src/services/orders/order-access.ts',
      'apps/api/src/services/orders/order-shared.ts',
      'apps/api/src/services/orders/order-status.ts',
    ],
  ],
]);

const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');
const abs = (p) => path.join(ROOT, p);
const norm = (p) => p.replaceAll('\\', '/');
const isFile = (p) => existsSync(abs(p));

const relocatedDestinationExists = (p) =>
  isFile(p) ||
  (S10_REPLACEMENTS.has(p) &&
    !isFile(p) &&
    S10_REPLACEMENTS.get(p).every((item) => isFile(item)));

const inventory = readdirSync(abs(SCOPE), { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith('.ts'))
  .map((d) => SCOPE + d.name);

for (const file of inventory)
  assert(origin.has(file), `Unmapped top-level service: ${file}`);

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
    /(?:apps\/api\/src\/services\/|src\/services\/|services\/)([\w.-]+(?:\.ts|\.tsx|\.js)?)/g,
    (whole, filename) => {
      const old = SCOPE + filename;
      const next = moved.get(old);

      return next
        ? whole.slice(0, whole.length - filename.length) +
            next.slice(SCOPE.length)
        : whole;
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
  // path.join(root, 'apps','api','src','services','foo.ts') and
  // resolve(process.cwd(), 'src','services','foo.ts') split literal paths.
  return source.replace(
    /(['"`])([\w.-]+)\1(\s*,\s*(['"`])([\w.-]+)\4){1,9}/g,
    (block) => {
      const m = [...block.matchAll(/(['"`])([\w.-]+)\1/g)];
      const tokens = m.map((x) => x[2]);
      const i = tokens.lastIndexOf('services');

      if (i < 0 || i + 1 >= tokens.length) return block;

      const name = tokens[i + 1];
      const target = moved.get(SCOPE + name);

      if (!target) return block;

      const newToken = target.slice(SCOPE.length);
      const x = m[i + 1];

      return (
        block.slice(0, x.index) +
        x[1] +
        newToken +
        x[1] +
        block.slice(x.index + x[0].length)
      );
    }
  );
}

//===================================================================

// Keep quote styles, line endings and all non-path code verbatim. No proxy files.
function rewrite(content, from, to) {
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

  for (const spec of getImports(before)) {
    const originalTarget = resolveInSet(file, spec, currentFiles);

    if (!originalTarget) continue; // Do not elevate unrelated baseline unresolved imports to S1 failures.

    const oldTarget = destination.get(originalTarget)?.from ?? originalTarget;
    const expected = mappedPath(oldTarget);
    const newSpecifiers = getImports(after);

    // Preserve declaration ordering even when an import's module path changes.
    const index = getImports(before).indexOf(spec);
    const result = resolveInSet(to, newSpecifiers[index] ?? spec, projected);

    checkedImports++;

    if (result !== expected)
      importErrors.push(
        `${file} -> ${to}: ${spec} expected ${expected}, got ${result ?? '<unresolved>'}`
      );
  }
}

if (importErrors.length)
  throw Error(
    `S1 import resolution failed (${importErrors.length}):\n` +
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

  // Literal old service file references are not allowed after its move.
  const pathPattern =
    /(?:apps\/api\/src\/services\/|src\/services\/|services\/)([\w.-]+\.ts)/g;

  for (const [file, content] of predicted) {
    for (const x of content.matchAll(pathPattern)) {
      const target = SCOPE + x[1];

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
      `S1 import/path gate failed (${failures.length}):\n` +
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
};

//===================================================================

console.log(JSON.stringify(report, null, 2));
