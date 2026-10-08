import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const protectedRouteSource = read('./auth/PharmacyProtectedRoute.tsx');

const profileSource = read(
  './profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
);

const ownerDocumentsSource = read(
  './profile/OwnerDocumentsPanel/OwnerDocumentsPanel.tsx'
);

//===================================================================

test('Stage 13.12 allows a new pharmacy Owner into the pharmacy app while blocked Owners are logged out and redirected', () => {
  assert.match(
    protectedRouteSource,
    /const isPharmacy = user\?\.role === 'pharmacy'/
  );

  assert.match(
    protectedRouteSource,
    /const isBlocked = user\?\.status === 'blocked'/
  );

  assert.match(protectedRouteSource, /if \(isBlocked\)/);
  assert.match(protectedRouteSource, /void logout\(\)/);

  assert.match(
    protectedRouteSource,
    /getSharedLoginUrl\(PHARMACY_ROUTES\.DASHBOARD\)/
  );

  assert.doesNotMatch(
    protectedRouteSource,
    /user\?\.status\s*(?:===|!==)\s*['"]active['"]/
  );
});

//===================================================================

test('Stage 13.12 keeps Owner profile and Owner document mutations available only in the owner membership surface', () => {
  assert.match(profileSource, /pharmacy\.membershipRole === 'owner'/);
  assert.match(profileSource, /<OwnerDocumentsPanel \/>/);

  assert.match(ownerDocumentsSource, /getMyPharmacyOwnerDocuments/);
  assert.match(ownerDocumentsSource, /uploadMyPharmacyOwnerDocument/);
  assert.match(ownerDocumentsSource, /deleteMyPharmacyOwnerDocument/);
  assert.match(ownerDocumentsSource, /confirmRemove/);
  assert.match(ownerDocumentsSource, /onChange=\{handleValuesChange\}/);
});
