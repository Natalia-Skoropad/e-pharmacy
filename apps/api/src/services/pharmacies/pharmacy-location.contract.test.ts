import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/services', path), 'utf8');

//===================================================================

test('Admin and Owner share field-safe location/pending copies without merging response policies', () => {
  const admin = read('admin/pharmacies/admin.service.ts');
  const pharmacy = read('pharmacies/pharmacy.service.ts');
  const helper = read('pharmacies/pharmacy-location.ts');
  const detail = read('admin/pharmacies/admin-pharmacy-detail-read.service.ts');

  assert.match(
    admin,
    /import\s*\{\s*clonePharmacyLocation\s*,\s*clonePendingModerationFields\s*,?\s*\}\s*from\s*['"][^'"]*\/pharmacy-location['"]/
  );

  assert.match(
    pharmacy,
    /clonePendingModerationFields as normalizePendingModerationPayload/
  );

  assert.doesNotMatch(admin, /function clonePharmacyLocation\(/);
  assert.doesNotMatch(pharmacy, /function clonePharmacyLocation\(/);
  assert.equal((helper.match(/export function/g) ?? []).length, 2);
  assert.match(helper, /documents: \[\.\.\.current\.documents\]/);
  assert.match(helper, /bankDetails: \{ \.\.\.current\.bankDetails \}/);
  assert.match(helper, /location: clonePharmacyLocation\(current\.location\)/);

  // An absent pending patch is a different contract for the two callers.
  assert.match(admin, /if \(!current\) return undefined/);
  assert.match(helper, /if \(!current\) return \{\}/);
  assert.match(pharmacy, /serializePendingModerationForProfile/);

  // Admin read-only detail must still allowlist fields and expose documentsCount
  // instead of private owner document metadata and hash/fingerprint values.
  assert.match(detail, /BANK_FIELDS\.filter/);
  assert.match(detail, /documentsCount: pending\.documents\.length/);
  assert.doesNotMatch(detail, /\{ \.\.\.pending \}/);
});
