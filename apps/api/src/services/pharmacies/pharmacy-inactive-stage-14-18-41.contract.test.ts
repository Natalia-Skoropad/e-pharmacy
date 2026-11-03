import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// An Inactive pharmacy must remain inspectable by its owner without enabling
// blocked operational mutations or changing persisted pharmacy status values.
const read = (name: string) =>
  readFile(resolve(process.cwd(), 'src/services/pharmacies', name), 'utf8');

//===================================================================

test('sales chart reads its exact inactive pharmacy, not a default membership', async () => {
  const controller = await read(
    '../../controllers/pharmacies/pharmacy.controller.ts'
  );

  const sales = controller.split(
    'export async function getOwnedPharmacySalesStatistics('
  )[1];

  assert.ok(sales);

  assert.match(
    sales,
    /getPharmacyMembership\(req\.user\?\.id \?\? '', pharmacyId, \{[\s\S]*?allowBlocked: true/
  );

  assert.match(
    sales,
    /getOrderSalesStatisticsForPharmacyService\(\s*pharmacyId/
  );
});

//===================================================================

test('read-only payment identifier availability works for an inactive member', async () => {
  const controller = await read(
    '../../controllers/pharmacies/pharmacy.controller.ts'
  );

  const section = controller
    .split('export async function getOwnedPharmacyPaymentAvailability(')[1]
    ?.split('export async function updateOwnedPharmacyDraft(')[0];

  assert.ok(section);

  assert.match(
    section,
    /getPharmacyMembership\([\s\S]*?pharmacyId,[\s\S]*?allowBlocked: true/
  );

  assert.match(section, /checkPaymentIdentifierDuplicates/);
  assert.match(section, /findOwnPharmacyIdentifierMatches/);
});

//===================================================================

test('internal pharmacy notes always use the requested pharmacy id', async () => {
  const [membership, notes] = await Promise.all([
    read('./pharmacy-membership.service.ts'),
    read('./pharmacy-note.service.ts'),
  ]);

  assert.match(
    membership,
    /requirePharmacyCapability\(actor\.id, capability, \{[\s\S]*?pharmacyId/
  );

  assert.match(
    membership,
    /allowBlocked: capability === 'read_internal_notes'/
  );

  assert.equal(
    (notes.match(/entityType === 'pharmacy' \? entityId : undefined/g) ?? [])
      .length,
    3
  );

  assert.match(
    notes,
    /await assertEntityAccess\(pharmacyId, entityType, entityId\)/
  );
});

//===================================================================

test('inactive notes stay read-only: blocked write guards remain in the membership gateway', async () => {
  const membership = await read('./pharmacy-membership.service.ts');

  assert.match(
    membership,
    /pharmacy\.status === PHARMACY_STATUSES\.BLOCKED && !options\.allowBlocked/
  );

  assert.match(
    membership,
    /allowBlocked: capability === 'read_internal_notes'/
  );
});
