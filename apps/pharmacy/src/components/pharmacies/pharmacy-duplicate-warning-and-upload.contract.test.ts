import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (file: string) =>
  readFileSync(new URL(file, import.meta.url), 'utf8');

const availability = read('./OwnedPharmacyEditor/usePaymentAvailability.ts');
const modal = read('./OwnedPharmacyEditor/DuplicateIdentifierSaveModal.tsx');

const edit = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
);

const create = read('./OwnedPharmacyEditor/OwnedPharmacyEditor.tsx');

const proxy = read(
  '../../app/api/pharmacies/me/pharmacies/[pharmacyId]/documents/route.ts'
);

//===================================================================

test('owner identifier collisions warn and request explicit save confirmation', () => {
  assert.match(availability, /warnings\[field\]/);
  assert.match(availability, /matches\[field\]/);
  assert.match(modal, /getReusedIdentifierFields/);
  assert.match(modal, /getOwnedPharmacyPath\(pharmacy\.id\)/);
  assert.match(modal, /Save shared details/);
  assert.match(edit, /setConfirmSharedOpen\(true\)/);
  assert.match(create, /setConfirmSharedOpen\(true\)/);
});

//===================================================================

test('scoped pharmacy document upload uses the large Base64 proxy preset', () => {
  assert.match(proxy, /method:\s*'POST'/);
  assert.match(proxy, /bodyPreset:\s*'documentUpload'/);
});
