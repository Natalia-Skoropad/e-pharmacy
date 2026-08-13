import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

//===================================================================

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), 'utf8');

//===================================================================

const [
  parserSource,
  pharmacyServiceSource,
  authTypesSource,
  fileModelSource,
  frontendErrorCodesSource,
  backendErrorCodesSource,
  clientProfileSource,
  pharmacyProfileSource,
] = await Promise.all([
  read('packages/api-client/src/response/shared-dto-parsers.ts'),
  read('apps/api/src/services/pharmacy.service.ts'),
  read('packages/types/src/auth/payloads.ts'),
  read('apps/api/src/models/pharmacyDocumentFile.model.ts'),
  read('packages/config/src/pharmacies/error-codes.ts'),
  read('apps/api/src/constants/pharmacy-profile.ts'),

  read(
    'apps/client/src/components/profile/ProfilePageContent/ProfilePageContent.tsx'
  ),

  read(
    'apps/pharmacy/src/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  ),
]);

//===================================================================

assert.match(parserSource, /function parsePharmacyVerificationDocument\(/);
assert.match(parserSource, /requireObjectId\(record, 'id', 'pharmacy profile'/);
assert.match(parserSource, /requireCanonicalIsoDateTime\(/);
assert.match(parserSource, /PHARMACY_STATUSES\.has/);
assert.match(parserSource, /parseEditablePharmacyBankDetails\(/);
assert.match(parserSource, /parsePharmacyPendingModeration\(/);

assert.doesNotMatch(
  parserSource,
  /checked<PharmacyProfile>\(record\)/,
  'PharmacyProfile must be reconstructed from validated fields rather than cast wholesale.'
);

assert.doesNotMatch(
  pharmacyServiceSource,
  /createMissingOwnerPharmacyProfile/,
  'GET /pharmacies/me/profile must not repair a missing domain profile.'
);

assert.match(pharmacyServiceSource, /PHARMACY_PROFILE_MISSING_ERROR_CODE/);

assert.match(
  authTypesSource,
  /pharmacyDocuments\?: PharmacyRegistrationDocumentClaim\[\]/,
  'Registration must accept server-issued document claims rather than browser metadata.'
);

for (const requiredField of [
  'content',
  'sha256',
  'claimTokenHash',
  'expiresAt',
]) {
  assert.match(
    fileModelSource,
    new RegExp(`\\b${requiredField}\\b`),
    `Stored pharmacy document model must contain ${requiredField}.`
  );
}

assert.match(fileModelSource, /expireAfterSeconds:\s*0/);

const profileErrorCodes = [
  'PHARMACY_PROFILE_MISSING',
  'PHARMACY_PROFILE_BLOCKED',
  'PHARMACY_PROFILE_LOCKED',
  'PHARMACY_PROFILE_INCOMPLETE',
  'PHARMACY_NO_PENDING_CHANGES',
];

for (const code of profileErrorCodes) {
  assert.match(frontendErrorCodesSource, new RegExp(`['"]${code}['"]`));
  assert.match(backendErrorCodesSource, new RegExp(`['"]${code}['"]`));
}

assert.doesNotMatch(
  clientProfileSource,
  /error\.message\.toLowerCase\(\)\.includes\(['"]phone['"]\)/,
  'Client profile conflicts must branch on stable backend codes, not English copy.'
);

assert.doesNotMatch(
  pharmacyProfileSource,
  /error instanceof Error && error\.message/,
  'Pharmacy profile must not expose raw backend error messages.'
);

console.log(
  'Profile contract check passed (strict PharmacyProfile parsing, explicit missing-profile semantics, and server-backed verification documents).'
);
