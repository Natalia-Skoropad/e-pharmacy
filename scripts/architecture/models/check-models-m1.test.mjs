import assert from 'node:assert/strict';

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import path from 'node:path';
import test from 'node:test';

import { fileURLToPath } from 'node:url';

//===================================================================

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const inventory = JSON.parse(
  readFileSync(
    path.join(repo, 'docs/architecture/models-m1/model-inventory.json'),
    'utf8'
  )
);

const map = JSON.parse(
  readFileSync(
    path.join(repo, 'docs/architecture/models-m1/model-relocation-map.json'),
    'utf8'
  )
);

//===================================================================

test('M1 model relocation covers every baseline file with one canonical location', () => {
  assert.equal(inventory.files.length, 30);
  assert.equal(map.moves.length, 30);
  assert.equal(new Set(map.moves.map((x) => x.to)).size, 30);

  assert.deepEqual(
    new Set(map.moves.map((x) => x.from)),
    new Set(inventory.files.map((x) => x.fromPath))
  );

  assert(
    map.moves.every(
      (x) => x.to.startsWith('apps/api/src/models/') && x.from !== x.to
    )
  );
});

//===================================================================

test('M1 registry, collection names, and all model registrations remain unique', () => {
  const models = inventory.files.filter((x) => x.kind === 'model');

  assert.equal(models.length, 27);
  assert(models.every((x) => x.modelNames.length === 1));

  assert.equal(
    new Set(models.flatMap((x) => x.modelNames)).size,
    models.length
  );

  assert.equal(
    models.reduce((n, x) => n + x.schemaDeclarations, 0),
    41
  );

  assert.equal(
    models.reduce((n, x) => n + x.indexDeclarations, 0),
    91
  );
});

//===================================================================

test('M1 full canonical-source parity and relative-import gate pass', () => {
  const output = JSON.parse(
    execFileSync(
      process.execPath,
      ['scripts/architecture/models/check-models-m1.mjs'],
      { cwd: repo, encoding: 'utf8' }
    )
  );

  assert.equal(output.status, 'PASS');
  assert.equal(output.obsoleteModelFiles, 0);
  assert.equal(output.invalidSchemaFingerprints, 0);
  assert.equal(output.relocated, 30);
  assert(output.modelImportReferences > 0);
});
