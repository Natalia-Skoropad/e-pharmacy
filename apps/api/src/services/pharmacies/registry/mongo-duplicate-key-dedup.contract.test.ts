import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('idempotent comment, draft, and rate-limit races use the structural duplicate-key predicate', () => {
  const consumers = [
    'services/pharmacies/pharmacy-create.service.ts',
    'services/pharmacies/pharmacy-note.service.ts',
    'services/owners/pharmacy-user-private-note.service.ts',
    'services/admin/employees/admin-employee-note.service.ts',
    'services/admin/owners/pharmacy-owner-admin-comment.service.ts',
    'services/admin/pharmacies/pharmacy-admin-comment.service.ts',
    'services/infrastructure/rate-limit-store.service.ts',
  ];

  for (const path of consumers) {
    const source = read(path);

    assert.match(source, /import \{ hasMongoDuplicateKeyCode \}/);
    assert.match(source, /hasMongoDuplicateKeyCode\(error\)/);
    assert.doesNotMatch(source, /error\.code === 11000/);

    assert.doesNotMatch(
      source,
      /function isDuplicateKeyError\(|function isDuplicateBucketInsert\(/
    );
  }

  const helper = read('utils/database/mongoError.ts');

  assert.match(
    helper,
    /error instanceof Error && hasMongoDuplicateKeyCode\(error\)/
  );

  const admin = read(
    'services/admin/pharmacies/pharmacy-admin-comment.service.ts'
  );

  assert.match(admin, /duplicateKey = true/);
  assert.match(admin, /findReplay\(adminUserId, input\.clientRequestId\)/);
});
