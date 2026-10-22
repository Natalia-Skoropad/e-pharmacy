import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(
    resolve(process.cwd(), 'src/services/pharmacies/registry', path),
    'utf8'
  );

//===============================================================

// This test intentionally reads source: it catches accidental reintroduction
// of per-application bounds/status tables without needing a database.
test('one rating/status definition serves admin and owned registries, without merging authorization', () => {
  const shared = read('./pharmacy-registry.constants.ts');

  const admin = read(
    '../../admin/pharmacies/admin-pharmacy-registry-read.service.ts'
  );

  const owned = read('../owned-pharmacy-registry-read.service.ts');

  const owners = read(
    '../../admin/owners/admin-pharmacy-owner-read.service.ts'
  );

  for (const service of [admin, owned, owners]) {
    assert.match(service, /registry\.constants/);
    assert.doesNotMatch(service, /const RATING_BOUNDS\s*=/);
  }

  for (const service of [admin, owned]) {
    assert.match(service, /STATUS_FIELDS/);
    assert.doesNotMatch(service, /const STATUS_FIELDS\s*=/);
  }

  assert.equal((shared.match(/inclusiveMax: false/g) ?? []).length, 4);
  assert.equal((shared.match(/inclusiveMax: true/g) ?? []).length, 1);
  assert.match(shared, /'4-5': \{ min: 4, max: 5, inclusiveMax: true \}/);

  for (const [name, status] of [
    ['new', 'NEW'],
    ['onVerification', 'ON_VERIFICATION'],
    ['active', 'ACTIVE'],
    ['onModeration', 'ON_MODERATION'],
    ['blocked', 'BLOCKED'],
  ])
    assert.ok(shared.includes(`['${name}', PHARMACY_STATUSES.${status}]`));

  assert.match(admin, /ownerSearchStages\(query\.ownerSearch\)/);
  assert.match(owned, /membershipStages\(userId\)/);
  assert.match(owners, /ownerId: ownerObjectId/);
});
