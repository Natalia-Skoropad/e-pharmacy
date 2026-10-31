import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// API tests run with apps/api as their working directory (CommonJS build).
const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

//===================================================================

const service = read(
  'services/pharmacies/pharmacy-payment-uniqueness.service.ts'
);

const controller = read('controllers/pharmacies/pharmacy.controller.ts');

//===================================================================

test('matching pharmacy identities are strictly scoped to owner and exclude selected pharmacy', () => {
  const fn =
    service
      .split('export async function findOwnPharmacyIdentifierMatches(')[1]
      ?.split('export function paymentIdentifiers(')[0] ?? '';

  assert.match(fn, /ownerId:\s*new Types\.ObjectId\(ownerUserId\)/);
  assert.match(fn, /_id:\s*\{ \$ne: new Types\.ObjectId\(pharmacyId\) \}/);
  assert.match(fn, /\.select\('_id name imageUrl'\)/);
  assert.match(fn, /\.limit\(10\)/);
  assert.doesNotMatch(fn, /email\s*:\s*pharmacy\.email/);
});

//===================================================================

test('both availability endpoints return warnings separately from hard conflicts', () => {
  assert.equal(
    (controller.match(/data:\s*\{ duplicates, matches \}/g) ?? []).length,
    2
  );

  assert.match(controller, /membershipRole !== 'owner'/);
});
