import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';

import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const tool = path.join(
  repo,
  'scripts/architecture/services/relocate-services-s1.mjs'
);

const fixture = (root, file, value) => {
  const full = path.join(root, file);

  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, value);
};

const run = (root, ...args) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.join(
          root,
          'scripts/architecture/services/relocate-services-s1.mjs'
        ),
        ...args,
      ],
      { cwd: root, encoding: 'utf8' }
    )
  );

const read = (root, file) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

test('S1 stage plan, pure dry-run, apply, path resolution, and no old proxies', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'epharmacy-s1-'));

  try {
    fixture(
      root,
      'scripts/architecture/services/relocate-services-s1.mjs',
      readFileSync(tool, 'utf8')
    );

    mkdirSync(path.join(root, 'packages'), { recursive: true });

    fixture(
      root,
      'docs/architecture/services-s0/service-files.json',
      '{"immutable":true}\n'
    );

    fixture(
      root,
      'docs/architecture/services-s1/service-relocation-map.json',

      JSON.stringify({
        schemaVersion: 1,
        scope: 'apps/api/src/services/',

        moves: [
          {
            from: 'apps/api/src/services/demo.service.ts',
            to: 'apps/api/src/services/catalog/demo.service.ts',
            stage: 'S3',
          },
          {
            from: 'apps/api/src/services/demo.contract.test.ts',
            to: 'apps/api/src/services/catalog/demo.contract.test.ts',
            stage: 'S3',
          },
          {
            from: 'apps/api/src/services/seed.service.ts',
            to: 'apps/api/src/services/migrations/seed.service.ts',
            stage: 'S2',
          },
        ],
      })
    );

    fixture(
      root,
      'apps/api/src/services/demo.service.ts',
      "import { Model } from '../models/x.model';\nexport const demo = Model;\n"
    );

    fixture(
      root,
      'apps/api/src/services/demo.contract.test.ts',
      "import { demo } from './demo.service';\nimport { Model } from '../models/x.model';\nconst source = './demo.service.ts';\nconst route = '../controllers/demo.controller.ts';\n"
    );

    fixture(
      root,
      'apps/api/src/services/seed.service.ts',
      'export const seed = 1;\n'
    );

    fixture(
      root,
      'apps/api/src/models/x.model.ts',
      'export const Model = {};\n'
    );

    fixture(
      root,
      'apps/api/src/controllers/demo.controller.ts',
      "import { demo } from '../services/demo.service';\nexport { demo };\n"
    );

    fixture(
      root,
      'apps/api/src/scripts/seed.ts',
      "import { seed } from '../services/seed.service';\nexport { seed };\n"
    );

    fixture(
      root,
      'scripts/checks/demo.mjs',
      "const a = 'apps/api/src/services/demo.service.ts';\nconst b = 'src/services/seed.service.ts';\nconst c = ['apps', 'api', 'src', 'services', 'demo.service.ts'];\n"
    );

    assert.equal(run(root, '--check').completedBeforeRun, 0);
    assert.equal(run(root, '--dry-run', '--stage', 'S3').selectedMoves, 2);

    assert(
      existsSync(path.join(root, 'apps/api/src/services/demo.service.ts')),
      'Dry-run cannot move source'
    );

    assert.equal(run(root, '--apply', '--stage', 'S3').selectedMoves, 2);

    assert(
      !existsSync(path.join(root, 'apps/api/src/services/demo.service.ts')),
      'No old proxy files'
    );

    assert.equal(run(root, '--check', '--stage', 'S3').completedBeforeRun, 2);

    assert.match(
      read(root, 'apps/api/src/controllers/demo.controller.ts'),
      /services\/catalog\/demo\.service/
    );

    assert.match(
      read(root, 'apps/api/src/services/catalog/demo.service.ts'),
      /\.\.\/\.\.\/models\/x\.model/
    );

    assert.match(
      read(root, 'apps/api/src/services/catalog/demo.contract.test.ts'),
      /\.\.\/\.\.\/controllers\/demo\.controller\.ts/
    );

    assert.match(
      read(root, 'scripts/checks/demo.mjs'),
      /'services', 'catalog\/demo\.service\.ts'/
    );

    assert.equal(run(root, '--apply', '--stage', 'S3').touchedFiles, 0);
    assert.equal(run(root, '--apply', '--stage', 'S2').selectedMoves, 1);

    assert.match(
      read(root, 'apps/api/src/scripts/seed.ts'),
      /services\/migrations\/seed\.service/
    );

    assert.equal(run(root, '--check').completedBeforeRun, 3);

    assert.equal(
      read(root, 'docs/architecture/services-s0/service-files.json'),
      '{"immutable":true}\n'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
