import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { auditControllers, runAudit } from './check-api-controllers-a1.mjs';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = runAudit();

const source = readFileSync(
  resolve(ROOT, 'apps/api/src/controllers/shared/document-attachment.ts'),
  'utf8'
);

//===================================================================

function walkFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);

    return entry.isDirectory() ? walkFiles(file) : [file];
  });
}

//===================================================================

function fixtures() {
  return {
    controllerFiles: Object.fromEntries(
      Object.keys(base.fileStatistics).map((name) => [
        name,
        readFileSync(resolve(ROOT, 'apps/api/src/controllers', name), 'utf8'),
      ])
    ),

    routeText: walkFiles(resolve(ROOT, 'apps/api/src/routes'))
      .filter((file) => file.endsWith('.ts'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n'),

    sharedHelperSource: source,
  };
}

//===================================================================

test('A1 covers 29 domain controllers, 157 routed handlers, and six document attachments', () => {
  assert.equal(base.status, 'PASS', base.errors.join('\n'));
  assert.equal(base.controllerFiles, 29);
  assert.equal(base.handlerExports, 157);
  assert.equal(base.attachmentHeaders, 6);
  assert.equal(base.notReferencedByRoutes, 0);
  assert.equal(base.directPersistenceImports, 0);
});

//===================================================================

test('A1 is read-only and rejects ambiguous or write flags', () => {
  const binary = resolve(
    ROOT,
    'scripts/architecture/check-api-controllers-a1.mjs'
  );

  for (const flags of [[], ['--apply'], ['--check', '--write']]) {
    const result = spawnSync(process.execPath, [binary, ...flags], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0, `should reject ${flags.join(' ')}`);
  }
});

//===================================================================

test('A1 rejects an unregistered controller handler', () => {
  const data = fixtures();

  data.controllerFiles['health/health.controller.ts'] +=
    '\nexport async function unregisteredA1Handler() {}\n';

  const audited = auditControllers(data);

  assert.deepEqual(audited.errors, [
    'health/health.controller.ts: exported handler unregisteredA1Handler is not referenced by a route',
    'Expected 157 routed handler exports, got 158',
  ]);
});

//===================================================================

test('A1 detects direct persistence access inside a controller', () => {
  const data = fixtures();

  data.controllerFiles['health/health.controller.ts'] +=
    "\nimport { User } from '../../models/auth/user.model';\n";

  assert(
    auditControllers(data).errors.some((error) =>
      error.includes('persistence access')
    )
  );
});

//===================================================================

test('A1 rejects reintroduced inline filename encoder', () => {
  const data = fixtures();

  data.controllerFiles['admin/admin.controller.ts'] +=
    '\nencodeURIComponent(document.name)\n';

  assert(
    auditControllers(data).errors.some((error) =>
      error.includes('duplicated document attachment encoding')
    )
  );
});

//===================================================================

test('A1 document attachment encoding exactly matches all historical controller expressions', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '-e',
      `const { documentAttachmentDisposition } = require(${JSON.stringify(resolve(ROOT, 'apps/api/src/controllers/shared/document-attachment.ts'))});
for (const name of ['a.pdf', "name (final)!'.pdf", 'Заява №1.pdf', 'a\\r\\nX-Injected: yes.pdf']) {
 const expected = "attachment; filename*=UTF-8''" + encodeURIComponent(name).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
 if (documentAttachmentDisposition(name) !== expected) process.exit(1);
}`,
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );

  assert.equal(result.status, 0, result.stderr);
});
