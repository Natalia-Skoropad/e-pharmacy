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

  // Existence checks are used only to reject manager-only identities.
  // They must not require a pharmacy for a newly registered owner.
  assert.match(source, /Pharmacy\.exists\(\{ ownerId: ownerUserId \}\)/);
  assert.match(source, /Pharmacy\.exists\(\{ managerUserIds: ownerUserId \}\)/);

  assert.match(
    source,
    /if \(managesPharmacy && !ownsPharmacy\) \{[\s\S]*?HTTP_STATUS\.FORBIDDEN/
  );

  assert.doesNotMatch(source, /if \(!ownsPharmacy\) \{/);
  assert.match(source, /PharmacyOwnerDocument\.find\(\{ ownerUserId \}\)/);
});
