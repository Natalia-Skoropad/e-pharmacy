import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const source = readFileSync(
  resolve(__dirname, 'pharmacy-owner-document.service.ts'),
  'utf8'
);

//===============================================================

test('owner documents authorize by pharmacy-role account, not existence of linked pharmacies', () => {
  assert.match(
    source,
    /User\.exists\(\{ _id: ownerUserId, role: USER_ROLES\.PHARMACY \}\)/
  );

  assert.doesNotMatch(source, /Pharmacy\.exists\(\{ ownerId: ownerUserId \}\)/);
  assert.match(source, /PharmacyOwnerDocument\.find\(\{ ownerUserId \}\)/);
});
