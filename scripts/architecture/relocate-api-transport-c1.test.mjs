#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';

import os from 'node:os';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

import test from 'node:test';

//===================================================================

const sourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const executable = 'scripts/architecture/relocate-api-transport-c1.mjs';
const fixtureTest = 'scripts/architecture/relocate-api-transport-c1.test.mjs';

const manifestName =
  'docs/architecture/transport-c1/transport-relocation-map.json';

const manifest = JSON.parse(
  readFileSync(path.join(sourceRoot, manifestName), 'utf8')
);

//===================================================================

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'api-transport-c1-'));

  const write = (relative, value) => {
    const full = path.join(root, relative);

    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, value);
  };

  mkdirSync(path.join(root, 'packages'), { recursive: true });

  const fixtureCode = new Map([
    [
      'apps/api/src/routes/index.ts',
      "import healthRoutes from './health.routes';\n" +
        "const literal = 'src/routes/health.routes.ts';\n" +
        "const joined = path.join('src', 'routes', 'health.routes.ts');\n" +
        'export { healthRoutes, literal, joined };\n',
    ],
    [
      'apps/api/src/routes/health.routes.ts',
      "import { health } from '../controllers/health.controller';\n" +
        'export default health;\n',
    ],
    [
      'apps/api/src/controllers/health.controller.ts',
      "import { context } from '../middlewares/request-context.middleware';\n" +
        'export const health = context;\n',
    ],
    [
      'apps/api/src/middlewares/request-context.middleware.ts',
      'export const context = true;\n',
    ],
    [
      'apps/api/src/controllers/auth.controller.ts',
      "import { login } from '../services/auth/auth-login.service';\n" +
        'export const auth = login;\n',
    ],
    [
      'apps/api/src/routes/cart.routes.ts',
      "import { cart } from '../controllers/cart.controller';\n" +
        'export default cart;\n',
    ],
    ['apps/api/src/controllers/cart.controller.ts', 'export const cart = 1;\n'],
  ]);

  for (const entry of manifest.moves)
    write(
      entry.from,
      fixtureCode.get(entry.from) ?? 'export const fixture = true;\n'
    );

  write(
    'apps/api/src/routes/index.ts',
    fixtureCode.get('apps/api/src/routes/index.ts')
  );

  write(
    'apps/api/src/services/auth/auth-login.service.ts',
    'export const login = 1;\n'
  );

  const testManifest = structuredClone(manifest);

  // Synthetic fixture represents only one route registration and no real mounts.
  testManifest.httpContracts = { mounts: 0, registrations: 0 };
  write(manifestName, JSON.stringify(testManifest));
  cpSync(path.join(sourceRoot, executable), path.join(root, executable));

  // Also include this regression test: otherwise accidental self-rewrites go undetected.
  cpSync(path.join(sourceRoot, fixtureTest), path.join(root, fixtureTest));

  const run = (...args) =>
    JSON.parse(
      execFileSync(process.execPath, [path.join(root, executable), ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );

  const file = (relative) => readFileSync(path.join(root, relative), 'utf8');
  const exists = (relative) => existsSync(path.join(root, relative));
  const close = () => rmSync(root, { recursive: true, force: true });

  return { root, run, file, exists, write, close };
}

//===================================================================

test('C1 inventory is exact, --check is read-only and C2 dry-run does not write', () => {
  const f = fixture();

  try {
    assert.equal(manifest.moves.length, 48);
    assert.equal(new Set(manifest.moves.map((m) => m.to)).size, 48);

    assert.deepEqual(Object.keys(manifest.stages), [
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
    ]);

    assert.equal(f.run('--check').completedBeforeRun, 0);
    assert.equal(f.run('--dry-run', '--stage', 'C2').selectedMoves, 11);
    assert.equal(f.exists('apps/api/src/routes/health.routes.ts'), true);

    assert.equal(
      f.exists('apps/api/src/routes/health/health.routes.ts'),
      false
    );

    assert.throws(() => f.run('--check', '--stage', 'C2'));
  } finally {
    f.close();
  }
});

//===================================================================

test('C2-C6 stages preserve imports and source paths; no proxies or .ts imports', () => {
  const f = fixture();

  try {
    for (const stage of Object.keys(manifest.stages)) {
      const result = f.run('--apply', '--stage', stage);

      assert(result.selectedMoves > 0);
      assert.equal(f.run('--check', '--stage', stage).selectedMoves, 0);
    }

    assert.equal(f.run('--check').completedBeforeRun, 48);

    assert.equal(
      f.file(fixtureTest),
      readFileSync(path.join(sourceRoot, fixtureTest), 'utf8'),
      'Relocation must not rewrite its own fixture assertions'
    );

    assert.equal(f.run('--dry-run', '--stage', 'C6').touchedFiles, 0);

    for (const entry of manifest.moves) {
      assert.equal(f.exists(entry.from), false, entry.from);
      assert.equal(f.exists(entry.to), true, entry.to);
    }

    assert.equal(f.exists('apps/api/src/routes/index.ts'), true);

    const index = f.file('apps/api/src/routes/index.ts');

    assert.match(index, /'\.\/health\/health\.routes'/);
    assert.match(index, /'src\/routes\/health\/health\.routes\.ts'/);
    assert.match(index, /'health\/health\.routes\.ts'/);

    assert.match(
      f.file('apps/api/src/routes/health/health.routes.ts'),
      /'\.\.\/\.\.\/controllers\/health\/health\.controller'/
    );

    assert.match(
      f.file('apps/api/src/controllers/auth/auth.controller.ts'),
      /'\.\.\/\.\.\/services\/auth\/auth-login\.service'/
    );

    assert.match(
      f.file('apps/api/src/routes/cart/cart.routes.ts'),
      /'\.\.\/\.\.\/controllers\/cart\/cart\.controller'/
    );
  } finally {
    f.close();
  }
});

//===================================================================

test('C1 refuses out-of-order stages, unexpected flat files and collisions', () => {
  const f = fixture();

  try {
    assert.throws(() => f.run('--apply', '--stage', 'C3'));

    f.write(
      'apps/api/src/controllers/not-mapped.controller.ts',
      'export {};\n'
    );

    assert.throws(() => f.run('--check'));

    rmSync(
      path.join(f.root, 'apps/api/src/controllers/not-mapped.controller.ts')
    );

    f.write(
      'apps/api/src/middlewares/security/origin.middleware.ts',
      'export {};\n'
    );

    assert.throws(() => f.run('--apply', '--stage', 'C2'));
  } finally {
    f.close();
  }
});
