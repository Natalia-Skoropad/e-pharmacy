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
  frontendTransitionsSource,
  backendTransitionsSource,
  transitionFixtureSource,
  membershipServiceSource,
  pharmacyTypesSource,
  pharmacyDocumentServiceSource,
  frontendDocumentValidationSource,
  backendDocumentValidationSource,
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
  read('packages/config/src/pharmacies/profile-transitions.ts'),
  read('apps/api/src/constants/pharmacy-profile.ts'),
  read('scripts/contracts/pharmacy-profile-transition-matrix.json'),
  read('apps/api/src/services/pharmacy-membership.service.ts'),
  read('packages/types/src/pharmacies/pharmacy-profile.ts'),
  read('apps/api/src/services/pharmacy-document.service.ts'),
  read('packages/validation/src/files/pharmacy-document-validation.ts'),
  read('apps/api/src/constants/pharmacy-document-validation.ts'),
]);

//===================================================================

function extractTransitionMatrix(source) {
  const match = source.match(
    /PHARMACY_PROFILE_ACTIONS_BY_STATUS\s*=\s*\{([\s\S]*?)\}\s*as const/
  );

  assert.ok(match, 'Could not find PHARMACY_PROFILE_ACTIONS_BY_STATUS');

  return Object.fromEntries(
    [...match[1].matchAll(/^\s*([a-z_]+):\s*\[([^\]]*)\]/gm)].map(
      ([, status, actionsSource]) => [
        status,
        [...actionsSource.matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]),
      ]
    )
  );
}

//===================================================================

assert.match(parserSource, /function parsePharmacyVerificationDocument\(/);
assert.match(parserSource, /requireObjectId\(record, 'id', 'pharmacy profile'/);
assert.match(parserSource, /requireCanonicalIsoDateTime\(/);
assert.match(parserSource, /PHARMACY_STATUSES\.has/);
assert.match(parserSource, /PHARMACY_MEMBERSHIP_ROLES\.has/);
assert.match(parserSource, /membershipRole:/);
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

assert.match(membershipServiceSource, /PHARMACY_PROFILE_MISSING_ERROR_CODE/);

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

for (const documentValidationSource of [
  frontendDocumentValidationSource,
  backendDocumentValidationSource,
]) {
  assert.match(
    documentValidationSource,
    /maxTotalSizeBytes:\s*30\s*\*\s*1024\s*\*\s*1024/,
    'Frontend and backend pharmacy document rules must enforce the 30 MB aggregate quota.'
  );
}

assert.match(
  pharmacyDocumentServiceSource,
  /createRegistrationPharmacyDocumentUploadSessionService/
);

assert.match(pharmacyDocumentServiceSource, /uploadedFiles/);
assert.match(pharmacyDocumentServiceSource, /uploadedBytes/);

const profileErrorCodes = [
  'PHARMACY_PROFILE_MISSING',
  'PHARMACY_PROFILE_BLOCKED',
  'PHARMACY_PROFILE_LOCKED',
  'PHARMACY_PROFILE_INCOMPLETE',
  'PHARMACY_NO_PENDING_CHANGES',
  'PHARMACY_PROFILE_ALREADY_SUBMITTED',
  'PHARMACY_PROFILE_CONFLICT',
  'PHARMACY_MODERATION_SUBMISSION_REQUIRED',
  'PHARMACY_OWNER_REQUIRED',
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

assert.match(
  authTypesSource,
  /expectedRevision:\s*ISODateTimeString/,
  'Client profile PATCH must carry an explicit server revision.'
);

assert.match(
  pharmacyTypesSource,
  /expectedRevision:\s*ISODateTimeString/,
  'Pharmacy profile mutations must carry an explicit server revision.'
);

assert.match(
  clientProfileSource,
  /applyCurrentUser\(response\.user\)/,
  'Client profile PATCH must apply the canonical AuthUser returned by the mutation.'
);

assert.doesNotMatch(
  clientProfileSource,
  /reloadCurrentUser/,
  'Client profile save must not turn a successful PATCH into a failure through a second GET.'
);

assert.doesNotMatch(
  pharmacyProfileSource,
  /error instanceof Error && error\.message/,
  'Pharmacy profile must not expose raw backend error messages.'
);

const expectedTransitionMatrix = JSON.parse(transitionFixtureSource);

assert.deepEqual(
  extractTransitionMatrix(frontendTransitionsSource),
  expectedTransitionMatrix,
  'Frontend pharmacy-profile transition matrix differs from the parity fixture.'
);

assert.deepEqual(
  extractTransitionMatrix(backendTransitionsSource),
  expectedTransitionMatrix,
  'Backend pharmacy-profile transition matrix differs from the parity fixture.'
);

assert.match(
  pharmacyTypesSource,
  /PharmacyMembershipRole\s*=\s*['"]owner['"]\s*\|\s*['"]manager['"]/
);

assert.match(
  membershipServiceSource,
  /owner:[\s\S]*?'read_profile'[\s\S]*?'edit_profile'[\s\S]*?'manage_documents'[\s\S]*?'submit_profile'/
);

assert.match(membershipServiceSource, /manager:\s*\[['"]read_profile['"]\]/);

assert.match(
  pharmacyServiceSource,
  /findPharmacyForProfileAccess\([\s\S]*?['"]read_profile['"]/
);

assert.match(
  pharmacyServiceSource,
  /findPharmacyForProfileAccess\([\s\S]*?['"]edit_profile['"]/
);

assert.match(
  pharmacyServiceSource,
  /findPharmacyForProfileAccess\([\s\S]*?['"]submit_profile['"]/
);

assert.match(
  pharmacyServiceSource,
  /membershipRole === ['"]manager['"] \? \[\]/
);

assert.match(
  pharmacyDocumentServiceSource,
  /findPharmacyForProfileAccess\([\s\S]*?['"]manage_documents['"]/
);

assert.match(
  pharmacyProfileSource,
  /pharmacy\?\.membershipRole === ['"]owner['"]/
);

assert.match(pharmacyProfileSource, /canPharmacyProfilePerformAction\(/);

assert.match(
  pharmacyServiceSource,
  /submitMyPharmacyModerationService[\s\S]*?withTransaction[\s\S]*?status:\s*PHARMACY_STATUSES\.ON_MODERATION/,
  'Active pharmacy moderation must merge changes and transition status atomically.'
);

assert.match(
  pharmacyServiceSource,
  /updatedAt:\s*new Date\(input\.expectedRevision\)/,
  'Pharmacy profile writes must compare the expected server revision.'
);

assert.match(
  pharmacyProfileSource,
  /submitMyPharmacyModeration\(\{[\s\S]*?changes:\s*payload,[\s\S]*?expectedRevision:\s*pharmacy\.updatedAt/,
  'Pharmacy UI must use the atomic moderation-submission command.'
);

assert.doesNotMatch(
  pharmacyProfileSource,
  /handleSendForModeration[\s\S]*?await updateMyPharmacyProfile\([\s\S]*?await sendMyPharmacyForVerification\(/,
  'Active moderation must not be split into save-then-submit browser mutations.'
);

console.log(
  'Profile contract check passed (strict parsing, revision conflicts, atomic moderation, explicit membership capabilities, missing-profile semantics, and server-backed verification documents).'
);
