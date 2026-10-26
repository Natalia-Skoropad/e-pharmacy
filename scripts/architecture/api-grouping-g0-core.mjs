// G0 baseline helpers. Read-only, dependency-free, and rooted at the repository.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

export const SOURCE = 'apps/api/src/';

export const DOMAINS = Object.freeze({
  constants: 'G1',
  schemas: 'G2',
  scripts: 'G3',
  types: 'G4',
  utils: 'G5',
});

export const BASE = 'docs/architecture/grouping-g0/';

const SKIP = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  'coverage',
  '.artifacts',
]);

const EXTENSIONS = [
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

const CODE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

const IMPORT =
  /\b(?:from\s*|import\s*\(\s*|import\s*|require\s*\(\s*)['"]([^'"\r\n]+)['"]/g;

const LITERAL_PATH =
  /(?:apps\/api\/src\/|api\/src\/|src\/)(?:constants|schemas|scripts|types|utils)\/[A-Za-z0-9_./-]+/g;

//===================================================================

export const norm = (p) => p.split(path.sep).join('/');
export const absolute = (p) => path.join(ROOT, p);
export const json = (p) => JSON.parse(readFileSync(absolute(p), 'utf8'));

export const sha = (buffer) =>
  createHash('sha256').update(buffer).digest('hex');

//===================================================================

// Cosmetic blank lines do not invalidate source-reference parity. Line numbers
// remain in the audit report as navigational hints only.
export const referenceFingerprint = (rows) =>
  sha(
    JSON.stringify(
      rows.map((row) => {
        const withoutLine = { ...row };

        delete withoutLine.line;

        return withoutLine;
      })
    )
  );

export const sourceHash = (text) =>
  sha(
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .filter(
        (line) =>
          line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
      )
      .join('\n')
  );

//===================================================================

export function walk(dir, include = () => true) {
  const result = [];

  function visit(p) {
    if (!existsSync(absolute(p))) return;

    for (const entry of readdirSync(absolute(p), { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name, 'en')
    )) {
      if (SKIP.has(entry.name)) continue;

      const next = `${p}${p.endsWith('/') ? '' : '/'}${entry.name}`;

      if (entry.isDirectory()) visit(next);
      else if (entry.isFile() && include(next)) result.push(next);
    }
  }

  visit(dir);

  return result.sort();
}

//===================================================================

export function inventory() {
  return Object.entries(DOMAINS)
    .flatMap(([folder, stage]) =>
      walk(`${SOURCE}${folder}/`).map((file) => {
        const buffer = readFileSync(absolute(file));
        const name = path.posix.basename(file);

        return {
          path: file,
          folder,
          stage,

          kind: /(?:^|\.)test\.[cm]?[jt]sx?$/.test(name)
            ? 'test'
            : name.endsWith('.json')
              ? 'fixture'
              : 'source',

          bytes: buffer.length,
          sha256: sha(buffer),
          normalizedSha256: sourceHash(buffer.toString('utf8')),
        };
      })
    )

    .sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

//===================================================================

function resolveSpecifier(from, spec) {
  if (!spec.startsWith('.')) return null;

  const base = path.resolve(path.dirname(absolute(from)), spec);

  for (const candidate of [
    base,

    ...EXTENSIONS.map((e) => base + e),
    ...EXTENSIONS.map((e) => path.join(base, `index${e}`)),
  ]) {
    if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;

    const rel = norm(path.relative(ROOT, candidate));

    if (!rel.startsWith('../') && !path.isAbsolute(rel)) return rel;
  }

  return null;
}

//===================================================================

export function scanSources() {
  // All application, package and repo tooling source is included, not only API.
  const candidates = [
    ...walk('apps/'),
    ...walk('packages/'),
    ...walk('scripts/'),
  ].filter(
    (p) =>
      CODE.test(p) &&
      !p.startsWith('scripts/architecture/check-api-grouping-g0') &&
      p !== 'scripts/architecture/api-grouping-g0-core.mjs'
  );

  const apiPaths = new Set(candidates.filter((p) => p.startsWith(SOURCE)));

  const dependencies = [];
  const literalPaths = [];
  const allGraphEdges = [];
  const unresolved = [];
  const impacted = [];

  const trackedPrefix = new RegExp(
    `^${SOURCE}(?:${Object.keys(DOMAINS).join('|')})/`
  );

  for (const file of candidates) {
    const code = readFileSync(absolute(file), 'utf8');

    let m;

    IMPORT.lastIndex = 0;

    while ((m = IMPORT.exec(code))) {
      const specifier = m[1];
      const target = resolveSpecifier(file, specifier);

      if (file.startsWith(SOURCE) && target && apiPaths.has(target))
        allGraphEdges.push([file, target]);

      const linked =
        trackedPrefix.test(file) || (target && trackedPrefix.test(target));

      if (linked) {
        const data = {
          from: file,
          specifier,
          resolved: target,
          line: 1 + code.slice(0, m.index).split('\n').length - 1,
        };

        dependencies.push(data);

        if (target && trackedPrefix.test(target)) impacted.push(data);
        if (specifier.startsWith('.') && !target) unresolved.push(data);
      }
    }

    LITERAL_PATH.lastIndex = 0;

    while ((m = LITERAL_PATH.exec(code))) {
      // Include test strings, filesystem accesses and documented literal paths.
      literalPaths.push({
        file,
        value: m[0],
        line: 1 + code.slice(0, m.index).split('\n').length - 1,
      });
    }
  }

  const cycles = findCycles(allGraphEdges);

  return {
    counts: {
      scannedCodeFiles: candidates.length,
      trackedImports: dependencies.length,
      importsIntoGroupedFolders: impacted.length,
      unresolvedTrackedRelativeImports: unresolved.length,
      literalSourcePaths: literalPaths.length,
      totalApiImportEdges: allGraphEdges.length,
      apiImportCycles: cycles.length,
    },

    dependencies: dependencies.sort(sortByJson),
    importsIntoGroupedFolders: impacted.sort(sortByJson),
    unresolvedTrackedRelativeImports: unresolved.sort(sortByJson),
    literalSourcePaths: literalPaths.sort(sortByJson),
    apiImportCycles: cycles,
  };
}

//===================================================================

const sortByJson = (a, b) =>
  JSON.stringify(a).localeCompare(JSON.stringify(b), 'en');

//===================================================================

function findCycles(edges) {
  const nodes = new Map();

  for (const [a, b] of edges) {
    if (!nodes.has(a)) nodes.set(a, []);
    if (!nodes.has(b)) nodes.set(b, []);

    nodes.get(a).push(b);
  }

  let serial = 0;

  const index = new Map(),
    low = new Map(),
    stack = [],
    onStack = new Set(),
    cycles = [];

  function visit(v) {
    index.set(v, serial);
    low.set(v, serial++);
    stack.push(v);
    onStack.add(v);

    for (const w of nodes.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }

    if (low.get(v) !== index.get(v)) return;

    const group = [];

    let w;

    do {
      w = stack.pop();
      onStack.delete(w);
      group.push(w);
    } while (w !== v);

    if (group.length > 1 || (nodes.get(v) ?? []).includes(v))
      cycles.push(group.sort());
  }

  for (const v of [...nodes.keys()].sort()) if (!index.has(v)) visit(v);

  return cycles.sort(sortByJson);
}

//===================================================================

export function scriptCommands() {
  const records = [];

  for (const file of ['package.json', 'apps/api/package.json']) {
    const scripts = json(file).scripts;

    for (const [name, command] of Object.entries(scripts)) {
      const matches = [
        ...command.matchAll(
          /(?:src\/scripts\/|apps\/api\/src\/scripts\/)([\w./-]+\.(?:ts|mjs|js))/g
        ),
      ];

      for (const m of matches) {
        const target = `${SOURCE}scripts/${m[1]}`;

        records.push({
          file,
          command: name,
          target,
          executable: command,
          targetExists: existsSync(absolute(target)),
        });
      }
    }
  }

  return records.sort(sortByJson);
}

//===================================================================

export function verifyMap(moves, files) {
  const errors = [],
    sourcePaths = new Set(),
    tos = new Set();

  if (moves.length !== files.length)
    errors.push(
      `Expected ${files.length} manifest entries; got ${moves.length}`
    );

  const bySource = new Map(files.map((item) => [item.path, item]));

  for (const m of moves) {
    if (sourcePaths.has(m.from)) errors.push(`Duplicate old path: ${m.from}`);
    if (tos.has(m.to)) errors.push(`Destination collision: ${m.to}`);

    sourcePaths.add(m.from);
    tos.add(m.to);

    if (!bySource.has(m.from)) errors.push(`Unknown old path: ${m.from}`);

    const expected = bySource.get(m.from);

    if (expected && m.stage !== expected.stage)
      errors.push(`Stage mismatch: ${m.from}`);

    if (
      !Object.keys(DOMAINS).some(
        (name) =>
          m.from.startsWith(`${SOURCE}${name}/`) &&
          m.to.startsWith(`${SOURCE}${name}/`)
      )
    )
      errors.push(`Cross-scope move: ${m.from}`);

    if (
      m.to.includes('..') ||
      m.to.includes('\\') ||
      m.to.includes('//') ||
      m.to.startsWith('/')
    )
      errors.push(`Unsafe destination: ${m.to}`);

    if (path.posix.extname(m.to) !== path.posix.extname(m.from))
      errors.push(`Changed file extension: ${m.from}`);

    if (m.from !== m.to && existsSync(absolute(m.to)))
      errors.push(`Target already exists: ${m.to}`);

    if (m.from === m.to && !m.stable)
      errors.push(`Explicit stable flag required: ${m.from}`);
  }

  for (const item of files)
    if (!sourcePaths.has(item.path))
      errors.push(`Missing source mapping: ${item.path}`);

  return errors;
}
