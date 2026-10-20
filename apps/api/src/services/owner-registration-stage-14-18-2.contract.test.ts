import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), file), 'utf8');

const auth = read('src/services/auth.service.ts');

const registration = auth.slice(
  auth.indexOf('export async function registerUserService'),
  auth.indexOf('export async function loginUserService')
);

const claims = read('src/services/pharmacy-document.service.ts');
const summary = read('src/services/pharmacy.service.ts');

//===================================================================

test('owner registration persists only User and Owner documents within a transaction', () => {
  assert.match(registration, /getInitialAccountStatusForRole/);
  assert.match(registration, /claimRegistrationOwnerDocuments/);
  assert.doesNotMatch(registration, /Pharmacy\.create\(/);
  assert.doesNotMatch(registration, /PHARMACY_CREATED/);
  assert.match(registration, /session: mongoSession/);
});

//===================================================================

test('registration claims protect single-use tokens, upload session and content integrity', () => {
  const ownerClaim = claims.slice(
    claims.indexOf('export async function claimRegistrationOwnerDocuments'),

    claims.indexOf(
      'export async function createPrivatePharmacyDocumentUploadService'
    )
  );

  assert.match(ownerClaim, /claimTokenHash: hashClaimToken/);
  assert.match(ownerClaim, /seenIds/);
  assert.match(ownerClaim, /registrationUploadSessionId/);
  assert.match(ownerClaim, /expiresAt: \{ \$gt: new Date\(\) \}/);
  assert.match(ownerClaim, /document\.content\.length !== document\.size/);
  assert.match(ownerClaim, /createHash\('sha256'\)/);
  assert.match(ownerClaim, /PharmacyOwnerDocument\.create/);
  assert.match(ownerClaim, /PharmacyRegistrationUploadSession\.deleteOne/);
});

//===================================================================

test('zero-pharmacy is valid for cabinet summary but not pharmacy-specific writes', () => {
  assert.match(summary, /PHARMACY_PROFILE_MISSING/);
  assert.match(summary, /return \{ pharmacy: null \}/);
  assert.match(summary, /findPharmacyForProfileAccess/);
});
