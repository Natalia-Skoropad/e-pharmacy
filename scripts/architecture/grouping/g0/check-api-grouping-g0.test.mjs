import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  BASE,
  ROOT,
  absolute,
  inventory,
  json,
  sha,
  sourceHash,
  scanSources,
  scriptCommands,
  verifyMap,
} from './api-grouping-g0-core.mjs';

//===================================================================

test('G0 inventories all five current directories with exactly one safe planned location per file', () => {
  const files = inventory();
  const plan = json(`${BASE}relocation-plan.json`);

  assert.equal(files.length, 153);

  assert.deepEqual(
    files.reduce((acc, item) => {
      acc[item.folder] = (acc[item.folder] ?? 0) + 1;

      return acc;
    }, {}),

    { constants: 35, schemas: 50, scripts: 14, types: 23, utils: 31 }
  );

  assert.deepEqual(verifyMap(plan.moves, files), []);
  assert.equal(plan.moves.filter((item) => !item.stable).length, 140);
  assert.equal(plan.moves.filter((item) => item.stable).length, 13);
});

//===================================================================

test('G0 rejects path collisions, traversal and unaccounted changes rather than creating legacy proxies', () => {
  const files = inventory();
  const plan = json(`${BASE}relocation-plan.json`);
  const collision = structuredClone(plan.moves);

  collision[1].to = collision[0].to;
  assert.match(verifyMap(collision, files).join('\n'), /Destination collision/);

  const traversal = structuredClone(plan.moves);

  traversal[1].to = 'apps/api/src/schemas/../../../outside.ts';
  assert.match(verifyMap(traversal, files).join('\n'), /Unsafe destination/);

  assert.match(
    verifyMap(plan.moves.slice(1), files).join('\n'),
    /Missing source mapping/
  );
});

//===================================================================

test('G0 permits blank lines and decorative separators, but rejects meaningful code drift', () => {
  const original = 'const options = {\n  required: true,\n};\n';

  const cosmetics =
    '//===============================================================\r\n\r\nconst options = {\r\n\r\n  required: true,\r\n};\r\n';

  assert.equal(sourceHash(original), sourceHash(cosmetics));

  assert.notEqual(
    sourceHash(original),
    sourceHash(original.replace('true', 'false'))
  );

  assert.notEqual(
    sourceHash(original),
    sourceHash(original.replace('required', 'optional'))
  );
});

//===================================================================

test('G0 sees existing code imports, cycle baseline, literal paths and operational entrypoints', () => {
  const dependencies = scanSources();

  assert.equal(dependencies.counts.unresolvedTrackedRelativeImports, 0);
  assert.equal(dependencies.counts.apiImportCycles, 0);
  assert.ok(dependencies.counts.importsIntoGroupedFolders > 100);

  const commands = scriptCommands();

  assert.equal(commands.length, 14);
  assert.ok(commands.every((item) => item.targetExists));

  assert.ok(
    commands.some((item) => item.target.endsWith('/copy-templates.mjs'))
  );

  assert.ok(commands.some((item) => item.target.endsWith('/seed.ts')));
});

//===================================================================

test('G0 CLI is read-only, deterministic and passes against the archived working tree', () => {
  const watched = [
    'apps/api/src/schemas/pharmacy.schema.ts',
    'apps/api/src/scripts/copy-templates.mjs',
    `${BASE}source-inventory.json`,
    `${BASE}relocation-plan.json`,
  ];

  const hashesBefore = watched.map((file) => sha(readFileSync(absolute(file))));

  const output = execFileSync(
    process.execPath,
    ['scripts/architecture/grouping/g0/check-api-grouping-g0.mjs', '--check'],
    {
      cwd: ROOT,
      encoding: 'utf8',
    }
  );

  const result = JSON.parse(output);

  assert.equal(result.status, 'PASS');
  assert.equal(result.inventoryFiles, 153);

  assert.deepEqual(
    watched.map((file) => sha(readFileSync(absolute(file)))),
    hashesBefore
  );
});
