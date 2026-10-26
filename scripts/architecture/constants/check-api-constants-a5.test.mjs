import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeConstants, parseArgs } from './check-api-constants-a5.mjs';

//===================================================================

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const check = (path, mutate) =>
  analyzeConstants(ROOT, {
    sourceOverrides: new Map([[path, mutate(read(path))]]),
  });

const auth = 'apps/api/src/constants/auth/auth.ts';
const category = 'apps/api/src/constants/catalog/product-category.ts';
const permissions = 'apps/api/src/constants/admin/access/admin-permissions.ts';

//===================================================================

test('A5 inventories exactly the canonical 35 G1 files and value owners', () => {
  const result = analyzeConstants(ROOT);

  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.equal(result.constantFiles, 35);
  assert(result.exportedValues > 40);

  assert.deepEqual(result.sharedDomainMirrors, [
    'AUTH_APPLICATIONS',
    'USER_ROLES',
    'PHARMACY_STATUSES',
  ]);
});

//===================================================================

test('A5 is strictly read-only; no apply, dry-run, or implicit mode', () => {
  assert.doesNotThrow(() => parseArgs(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--help'],
  ])
    assert.throws(() => parseArgs(args));
});

//===================================================================

test('A5 rejects unexpected new files and old flat proxies', () => {
  assert.match(
    analyzeConstants(ROOT, {
      extraPaths: ['apps/api/src/constants/legacy-proxy.ts'],
    }).errors.join('\n'),
    /Unexpected constant/
  );
});

//===================================================================

test('A5 rejects shared domain role divergence', () => {
  assert.match(
    check(auth, (s) =>
      s.replace(
        "export const USER_ROLES = {\n  CLIENT: 'client'",
        "export const USER_ROLES = {\n  CLIENT: 'guest'"
      )
    ).errors.join('\n'),
    /USER_ROLES differs/
  );
});

//===================================================================

test('A5 rejects shared pharmacy statuses divergence', () => {
  assert.match(
    check(auth, (s) =>
      s.replace("ON_MODERATION: 'on_moderation'", "ON_MODERATION: 'pending'")
    ).errors.join('\n'),
    /PHARMACY_STATUSES differs/
  );
});

//===================================================================

test('A5 protects 5 canonical product-category seeds and disallows Other', () => {
  assert.match(
    check(category, (s) =>
      s.replace("slug: 'medicine'", "slug: 'other'")
    ).errors.join('\n'),
    /changed canonical five seed slugs/
  );

  assert.match(
    check(category, (s) => s.replace("['standard']", "['other']")).errors.join(
      '\n'
    ),
    /Other is not a supported persisted value/
  );
});

//===================================================================

test('A5 rejects duplicate auth error codes', () => {
  assert.match(
    check(auth, (s) =>
      s.replace(
        "SESSION_REVOKED: 'AUTH_SESSION_REVOKED'",
        "SESSION_REVOKED: 'AUTH_SESSION_INVALID'"
      )
    ).errors.join('\n'),
    /Duplicated\/nonstatic error codes/
  );
});

//===================================================================

test('A5 rejects mismatched permission resources and actions', () => {
  assert.match(
    check(permissions, (s) =>
      s.replace(
        "  audit: {\n    view: permission('audit', 'view'),",
        "  audit: {\n    edit: permission('audit', 'view'),"
      )
    ).errors.join('\n'),
    /permission action mismatch/
  );
});

//===================================================================

test('A5 rejects duplicate HTTP status codes', () => {
  const p = 'apps/api/src/constants/http/httpStatus.ts';

  assert.match(
    check(p, (s) => s.replace('CREATED: 201', 'CREATED: 200')).errors.join(
      '\n'
    ),
    /HTTP_STATUS: duplicate/
  );
});

//===================================================================

test('A5 production audit does not mutate canonical sources or pinned G6 manifests', () => {
  const files = [
    auth,
    category,
    permissions,
    'docs/architecture/grouping-g6/canonical-source-fingerprints.json',
  ];

  const prior = files.map(read);

  assert.equal(analyzeConstants(ROOT).status, 'PASS');
  assert.deepEqual(files.map(read), prior);
});
