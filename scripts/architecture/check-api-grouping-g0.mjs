#!/usr/bin/env node
// Immutable, read-only G0 baseline gate. For the pre-G1 tree only.
// G1-G5 require a separate staged relocation gate, not a relaxed G0 gate.
import assert from 'node:assert/strict';

import {
  BASE,
  DOMAINS,
  inventory,
  json,
  scanSources,
  scriptCommands,
  sha,
  referenceFingerprint,
  verifyMap,
} from './api-grouping-g0-core.mjs';

//===================================================================

const args = process.argv.slice(2);

if (args.some((arg) => arg !== '--check'))
  throw Error('G0 accepts only --check; it never writes files');

const baseline = json(`${BASE}source-inventory.json`);
const mapping = json(`${BASE}relocation-plan.json`);
const references = json(`${BASE}dependency-baseline.json`);
const commands = json(`${BASE}script-entrypoints.json`);

assert.equal(baseline.schemaVersion, 1);
assert.equal(mapping.schemaVersion, 1);
assert.equal(references.schemaVersion, 1);
assert.equal(commands.schemaVersion, 1);

assert.deepEqual(
  mapping.scope,
  Object.keys(DOMAINS).map((d) => `apps/api/src/${d}/`)
);

//===================================================================

const current = inventory();
const errors = verifyMap(mapping.moves, current);
const expectedFiles = new Map(baseline.files.map((v) => [v.path, v]));
const actualFiles = new Map(current.map((v) => [v.path, v]));

for (const expected of baseline.files) {
  const actual = actualFiles.get(expected.path);

  if (!actual) {
    errors.push(`Missing G0 file: ${expected.path}`);
    continue;
  }

  if (actual.stage !== expected.stage || actual.kind !== expected.kind)
    errors.push(`Changed G0 classification: ${expected.path}`);
  if (
    actual.sha256 !== expected.sha256 &&
    actual.normalizedSha256 !== expected.normalizedSha256
  )
    errors.push(
      `Modified G0 source beyond permitted blank lines/separator comments: ${expected.path}`
    );
}

for (const actual of current)
  if (!expectedFiles.has(actual.path))
    errors.push(`Unexpected G0 file: ${actual.path}`);

//===================================================================

const graph = scanSources();
const checkedCommands = scriptCommands();

for (const key of [
  'trackedImports',
  'importsIntoGroupedFolders',
  'unresolvedTrackedRelativeImports',
  'literalSourcePaths',
  'totalApiImportEdges',
  'apiImportCycles',
]) {
  if (graph.counts[key] !== references.counts[key])
    errors.push(
      `${key} baseline drift: ${references.counts[key]} → ${graph.counts[key]}`
    );
}

//===================================================================

// Verify *exact* reference inventory, not counts alone: catches stale source-path
// rewrites or missing relative targets where totals happen to stay the same.
for (const key of [
  'dependencies',
  'importsIntoGroupedFolders',
  'unresolvedTrackedRelativeImports',
  'literalSourcePaths',
  'apiImportCycles',
]) {
  if (referenceFingerprint(graph[key]) !== references.fingerprints[key])
    errors.push(`Dependency snapshot drift: ${key}`);
}

if (sha(JSON.stringify(checkedCommands)) !== commands.fingerprint)
  errors.push('API/root executable command paths changed');

if (checkedCommands.some((e) => !e.targetExists))
  errors.push('Broken API script command target');

if (errors.length) {
  throw new Error(
    `G0 baseline failed (${errors.length} findings):\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
  );
}

//===================================================================

const result = {
  status: 'PASS',
  stage: 'G0',
  mode: 'check',
  modelsAndRuntimeUnchanged: true,

  folders: Object.fromEntries(
    Object.keys(DOMAINS).map((name) => [
      name,
      current.filter((x) => x.folder === name).length,
    ])
  ),

  inventoryFiles: current.length,
  plannedMoves: mapping.moves.filter((e) => !e.stable).length,
  stableFiles: mapping.moves.filter((e) => e.stable).length,
  codeFilesScanned: graph.counts.scannedCodeFiles,
  importsIntoScope: graph.counts.importsIntoGroupedFolders,
  sourcePathLiterals: graph.counts.literalSourcePaths,
  preexistingApiCycles: graph.counts.apiImportCycles,
  scriptCommandReferences: checkedCommands.length,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
