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

test('Owner documents live in owner profile regardless of pharmacy membership', () => {
  assert.match(profileSource, /<OwnerDocumentsPanel \/>/);

  assert.doesNotMatch(
    profileSource,
    /pharmacy\.membershipRole|usePharmacyProfile/
  );

  assert.match(ownerDocumentsSource, /getMyPharmacyOwnerDocuments/);
  assert.match(ownerDocumentsSource, /uploadMyPharmacyOwnerDocument/);
  assert.match(ownerDocumentsSource, /deleteMyPharmacyOwnerDocument/);
  assert.match(ownerDocumentsSource, /confirmRemove/);
});
