import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('pharmacy notes enforce ownership for every supported entity type', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/pharmacy-note.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /entityType === 'pharmacy'[\s\S]*?pharmacyId\.equals\(objectId\)/
  );

  assert.match(
    source,
    /entityType === 'client'[\s\S]*?Order\.exists\(\{\s*pharmacyId,\s*userId: objectId\s*\}\)/
  );

  assert.match(
    source,
    /User\.exists\(\{[\s\S]*?_id: objectId,[\s\S]*?isDefaultPharmacyClient: true,[\s\S]*?defaultClientPharmacyId: pharmacyId/
  );

  assert.match(
    source,
    /entityType === 'product'[\s\S]*?ProductOffer\.exists\(\{[\s\S]*?pharmacyId,[\s\S]*?productId: objectId/
  );

  assert.match(
    source,
    /ProductRequest\.findOne\(\{[\s\S]*?_id: objectId,[\s\S]*?pharmacyId/
  );
});

//===================================================================

test('all pharmacy note operations pass through entity access validation', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/pharmacy-note.service.ts'),
    'utf8'
  );

  for (const serviceName of [
    'getPharmacyNotesService',
    'createPharmacyNoteService',
    'deletePharmacyNoteService',
  ]) {
    const start = source.indexOf(`export async function ${serviceName}`);
    assert.notEqual(start, -1);
    const nextExport = source.indexOf('export async function', start + 1);

    const body = source.slice(
      start,
      nextExport === -1 ? undefined : nextExport
    );

    assert.match(body, /await assertEntityAccess\(/);
  }
});

//===================================================================

test('pharmacy note routes require the authenticated pharmacy role', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/routes/pharmacy-note.routes.ts'),
    'utf8'
  );

  assert.match(source, /pharmacyNoteRoutes\.use\([\s\S]*?authenticate/);
  assert.match(
    source,
    /pharmacyNoteRoutes\.use\([\s\S]*?authorizeRoles\(USER_ROLES\.PHARMACY\)/
  );
});

//===================================================================

test('pharmacy notes reuse centralized membership and blocked-pharmacy access', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/pharmacy-note.service.ts'),
    'utf8'
  );

  const membershipSource = await readFile(
    resolve(process.cwd(), 'src/services/pharmacy-membership.service.ts'),
    'utf8'
  );

  assert.doesNotMatch(source, /Pharmacy\.findOne\(/);
  assert.match(source, /findPharmacyForInternalNotesAccess/);
  assert.match(source, /'read_internal_notes'/);
  assert.match(source, /'manage_internal_notes'/);

  assert.match(
    membershipSource,
    /PHARMACY_INTERNAL_NOTES_CAPABILITIES_BY_MEMBERSHIP/
  );

  assert.match(
    membershipSource,
    /pharmacy\.status === PHARMACY_STATUSES\.BLOCKED/
  );

  assert.match(
    membershipSource,
    /actor\.role !== USER_ROLES\.PHARMACY[\s\S]*?Pharmacy access is forbidden/
  );
});
