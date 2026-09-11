import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function readServiceSource(): Promise<string> {
  return readFile(
    resolve(process.cwd(), 'src/services/pharmacy.service.ts'),
    'utf8'
  );
}

//===================================================================

test('current pharmacy summary exposes identity/status fields without private profile details', async () => {
  const source = await readServiceSource();
  const start = source.indexOf('function serializeCurrentPharmacySummary(');

  const end = source.indexOf(
    '//===============================================================',
    start + 1
  );

  assert.ok(start >= 0);
  assert.ok(end > start);

  const serializer = source.slice(start, end);

  assert.match(serializer, /id: String\(pharmacy\._id\)/);
  assert.match(serializer, /name: pharmacy\.name/);
  assert.match(serializer, /status: pharmacy\.status/);
  assert.match(serializer, /membershipRole/);

  assert.doesNotMatch(serializer, /bankDetails/);
  assert.doesNotMatch(serializer, /documents/);
  assert.doesNotMatch(serializer, /pendingModeration/);
});

//===================================================================

test('full profile serializer keeps owner-only private fields out of manager DTOs', async () => {
  const source = await readServiceSource();
  const start = source.indexOf('function serializePharmacyProfile(');

  const end = source.indexOf(
    '//===============================================================',
    start + 1
  );

  assert.ok(start >= 0);
  assert.ok(end > start);

  const serializer = source.slice(start, end);

  assert.match(
    serializer,
    /membershipRole !== 'manager' && pharmacy\.bankDetails/
  );

  assert.match(serializer, /documents: membershipRole === 'manager' \? \[\] :/);

  assert.match(
    serializer,
    /membershipRole !== 'manager' && pharmacy\.pendingModeration/
  );
});
