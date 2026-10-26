#!/usr/bin/env node
// A8: read-only TypeScript type/DTO audit; no runtime code or persistence access.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const API_PREFIX = 'apps/api/src/types/';
const SHARED_PREFIX = 'packages/types/src/';
const MANIFEST = 'docs/architecture/grouping-g0/relocation-plan.json';
const PINS = 'docs/architecture/grouping-g6/canonical-source-fingerprints.json';
const INVENTORY = 'docs/architecture/types-a8/type-audit-inventory.json';

//===================================================================

const slash = (p) => p.split('\\').join('/');

const walk = (p) =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) => {
    const target = join(p, e.name);
    return e.isDirectory() ? walk(target) : e.isFile() ? [target] : [];
  });

const sha = (s) => createHash('sha256').update(s).digest('hex');

const norm = (s) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

const exported = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;

const declaration = (node) =>
  ts.isTypeAliasDeclaration(node) ||
  ts.isInterfaceDeclaration(node) ||
  ts.isEnumDeclaration(node) ||
  ts.isClassDeclaration(node);

//===================================================================

export function assertReadOnlyFlags(args) {
  if (args.length !== 1 || args[0] !== '--check')
    throw Error('A8 is read-only; only --check is supported');
}

//===================================================================

export function auditTypes(root = ROOT, fixture = {}) {
  const sourceOverrides = fixture.sourceOverrides ?? new Map();
  const absent = new Set(fixture.absent ?? []);
  const added = fixture.added ?? [];

  const read = (p) =>
    sourceOverrides.get(p) ?? readFileSync(join(root, p), 'utf8');

  const g0 = JSON.parse(read(MANIFEST));
  const pins = JSON.parse(read(PINS)).hashes;
  const inventory = JSON.parse(read(INVENTORY));

  const expectedAPI = g0.moves
    .filter((m) => m.stage === 'G4')
    .map((m) => m.to)
    .sort();

  const expectedShared = inventory.sharedTypeFiles;
  const expected = [...expectedAPI, ...expectedShared];

  const actual = [
    ...walk(join(root, API_PREFIX)),
    ...walk(join(root, SHARED_PREFIX)),
  ]
    .map((p) => slash(relative(root, p)))
    .filter((p) => p.endsWith('.ts') && !absent.has(p))
    .concat(added)
    .sort();

  const known = new Set(actual);

  const errors = [],
    warnings = [],
    sourceStats = {};

  const exports = new Map(),
    signatureGroups = new Map(),
    internalEdges = [];

  let apiDeclarations = 0,
    sharedDeclarations = 0,
    exportedDeclarations = 0;

  let relativeImports = 0,
    unresolvedImports = 0,
    crossPackageImports = 0;

  const domainCounts = {};

  if (expectedAPI.length !== 23 || new Set(expectedAPI).size !== 23)
    errors.push('G4 must preserve 23 unique API type files');

  if (
    inventory.schemaVersion !== 1 ||
    inventory.stage !== 'A8' ||
    new Set(expectedShared).size !== expectedShared.length ||
    !expectedShared.length
  )
    errors.push('Invalid A8 shared type registry');

  for (const p of expected)
    if (!known.has(p)) errors.push(`Missing type module: ${p}`);

  for (const p of actual)
    if (!expected.includes(p)) errors.push(`Unreviewed type module: ${p}`);

  for (const item of g0.moves.filter((m) => m.stage === 'G4'))
    if (item.from !== item.to && existsSync(join(root, item.from)))
      errors.push(`Legacy flat type/proxy: ${item.from}`);

  for (const file of expected) {
    if (!known.has(file)) continue;

    const content = read(file);

    const parsed = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    if (parsed.parseDiagnostics.length)
      errors.push(
        `Invalid TS type file ${file}: ${ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, '\n')}`
      );

    if (file.startsWith(API_PREFIX)) {
      const pin = pins[file];

      if (!pin || sha(norm(content)) !== pin.normalized)
        errors.push(`G6 immutable API type fingerprint drift: ${file}`);
    }

    const scope = file.startsWith(API_PREFIX) ? 'api' : 'shared';

    const domain = `${scope}/${
      file
        .split('/')
        .slice(scope === 'api' ? 4 : 3, -1)
        .join('/') || 'root'
    }`;

    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;

    let count = 0,
      exportedCount = 0,
      importedCount = 0;

    const ownNames = new Set();

    for (const stmt of parsed.statements) {
      if (declaration(stmt)) {
        count++;

        const name = stmt.name?.text;

        if (exported(stmt)) {
          exportedCount++;

          if (ownNames.has(name))
            errors.push(`Duplicate exported declaration: ${file}:${name}`);

          ownNames.add(name);

          const fq = `${file}:${name}`;

          exports.set(fq, true);

          if (
            (ts.isInterfaceDeclaration(stmt) && stmt.members.length >= 3) ||
            (ts.isTypeAliasDeclaration(stmt) &&
              ts.isTypeLiteralNode(stmt.type) &&
              stmt.type.members.length >= 3)
          ) {
            const members = ts.isInterfaceDeclaration(stmt)
              ? stmt.members
              : stmt.type.members;

            // Name-insensitive to the outer interface; compare member names and exact field type syntax.
            const shape = members.map((m) =>
              m.getText(parsed).replace(/\s+/g, '')
            );

            const key = sha(shape.join(';'));

            if (!signatureGroups.has(key)) signatureGroups.set(key, []);

            signatureGroups.get(key).push(fq);
          }
        }
      }

      if (!ts.isImportDeclaration(stmt) && !ts.isExportDeclaration(stmt))
        continue;

      const module = stmt.moduleSpecifier;

      if (!module || !ts.isStringLiteral(module)) continue;

      const specifier = module.text;

      if (
        specifier === '@e-pharmacy/types' ||
        specifier.startsWith('@e-pharmacy/types/')
      )
        crossPackageImports++;

      if (!specifier.startsWith('.')) continue;

      relativeImports++;
      importedCount++;

      const joined = slash(join(dirname(file), specifier));

      const candidates = [
        joined,
        `${joined}.ts`,
        `${joined}.tsx`,
        `${joined}/index.ts`,
        `${joined}/index.tsx`,
      ];

      const resolved = candidates.find(
        (p) => known.has(p) || existsSync(join(root, p))
      );

      if (!resolved) {
        unresolvedImports++;
        errors.push(`Unresolved relative import: ${file} -> ${specifier}`);
      } else if (known.has(resolved)) internalEdges.push([file, resolved]);
    }

    apiDeclarations += scope === 'api' ? count : 0;
    sharedDeclarations += scope === 'shared' ? count : 0;
    exportedDeclarations += exportedCount;

    sourceStats[file] = {
      scope,
      lines: content.split(/\r?\n/).length,
      declarations: count,
      exported: exportedCount,
      relativeImports: importedCount,
    };
  }

  // Only local edges within type trees; import cycles can make declarations difficult to maintain.
  const graph = new Map(expected.map((p) => [p, []]));

  for (const [a, b] of internalEdges) graph.get(a)?.push(b);

  const visiting = new Set(),
    visited = new Set(),
    cycles = [];

  function visit(p, stack) {
    if (visiting.has(p)) {
      cycles.push([...stack.slice(stack.indexOf(p)), p]);

      return;
    }

    if (visited.has(p)) return;

    visiting.add(p);

    for (const next of graph.get(p) ?? []) visit(next, [...stack, p]);

    visiting.delete(p);
    visited.add(p);
  }

  for (const p of expected) visit(p, []);

  if (cycles.length)
    errors.push(
      ...cycles.slice(0, 12).map((c) => `Type import cycle: ${c.join(' -> ')}`)
    );

  const express = `${API_PREFIX}infrastructure/express.ts`;

  if (known.has(express)) {
    const source = read(express);

    for (const snippet of [
      "declare module 'express'",
      'interface Request',
      'authSessionId?',
      'adminAuthorization?',
      'user?',
    ])
      if (!source.includes(snippet))
        errors.push(`Missing Express.Request augmentation ${snippet}`);
  }

  const duplicateShapes = [...signatureGroups.values()]
    .filter((group) => group.length >= 2)
    .map((g) => g.sort())
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (duplicateShapes.length)
    warnings.push(
      `${duplicateShapes.length} repeated type shapes are candidates, not safe automatic merges`
    );

  return {
    stage: 'A8',
    status: errors.length ? 'FAIL' : 'PASS',
    apiTypeFiles: expectedAPI.length,
    sharedTypeFiles: expectedShared.length,
    totalTypeFiles: expected.length,
    apiDeclarations,
    sharedDeclarations,
    exportedDeclarations,
    relativeImports,
    unresolvedImports,
    crossPackageImports,
    typeImportEdges: internalEdges.length,
    typeImportCycles: cycles.length,
    duplicateShapeGroups: duplicateShapes,
    domainCounts,
    sourceStats,
    warnings,
    errors,
  };
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    assertReadOnlyFlags(process.argv.slice(2));

    const result = auditTypes();

    console.log(JSON.stringify(result, null, 2));

    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
