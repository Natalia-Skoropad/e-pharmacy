import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// The test runner executes with apps/api as cwd, not the monorepo root.
// Resolve paths relative to this test instead of depending on process.cwd().
const repositoryRoot = resolve(__dirname, '../../../../..');

const src = (path: string) =>
  readFileSync(resolve(repositoryRoot, path), 'utf8');

//===================================================================

const s = (name: string) => src(`apps/api/src/services/pharmacies/${name}`);

const editor = src(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
);

const actions = src(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
);

//===================================================================

test('active saves require completeness in both UI and API', () => {
  // Draft mode also covers blocked pharmacies and correction flows.
  // Active pharmacies must keep strict verification-level validation.
  const validationMode = editor.match(
    /const validationMode\s*=\s*([\s\S]*?)\s*\?\s*'draft'\s*:\s*'verification';/
  );

  assert.ok(
    validationMode,
    'Expected explicit draft/verification mode selection'
  );

  assert.match(validationMode[1], /pharmacy\.status === 'new'/);
  assert.match(validationMode[1], /pharmacy\.status === 'blocked'/);

  assert.match(
    validationMode[1],
    /pharmacy\.status === 'on_reactivation' &&\s*pharmacy\.reviewState === 'changes_requested'/
  );

  assert.match(
    validationMode[1],
    /pharmacy\.status === 'on_verification' &&\s*pharmacy\.reviewState === 'changes_requested'/
  );

  assert.doesNotMatch(validationMode[1], /pharmacy\.status === 'active'/);

  assert.match(
    editor,
    /validatePharmacyEditor\(\s*values,\s*documents\.length,\s*validationMode\s*\)/
  );

  assert.match(editor, /hasValidationErrors/);

  assert.match(
    editor,
    /disabled=\{!dirty \|\| busy !== null \|\| hasValidationErrors\}/
  );

  assert.match(
    s('pharmacy-owner-profile.service.ts'),
    /missingRequiredModerationFields\(/
  );
});

//===================================================================

test('empty and unchanged pending proposals cannot be submitted', () => {
  assert.match(actions, /const hasChanges = moderationSummary\.length > 0/);

  assert.match(
    s('pharmacy-moderation.service.ts'),
    /hasEffectiveModerationChanges\(pharmacy, pendingBeforeSubmission\)/
  );
});

//===================================================================

test('payment identifiers are globally reserved for published and pending values', () => {
  const unique = s('pharmacy-payment-uniqueness.service.ts');

  assert.match(unique, /'taxId', 'iban', 'receiptEmail'/);
  assert.match(unique, /pendingModeration\.bankDetails/);
  assert.match(unique, /unique: true/);
  assert.doesNotMatch(unique, /name: 'payment_identifier_global_unique'/);
  assert.match(unique, /collection\.createIndex\(/);
  assert.match(unique, /syncPharmacyPaymentIdentifiers/);

  assert.match(
    s('pharmacy-owner-profile.service.ts'),
    /syncPharmacyPaymentIdentifiers/
  );

  assert.match(
    src('apps/api/src/services/admin/pharmacies/admin.service.ts'),
    /syncPharmacyPaymentIdentifiers/
  );
});

//===================================================================

test('new drafts can be physically deleted only after checking dependent resources', () => {
  const del = s('pharmacy-owner-delete-draft.service.ts');

  assert.match(del, /PHARMACY_STATUSES\.NEW/);
  assert.match(del, /Order\.exists/);
  assert.match(del, /ProductRequest\.exists/);
  assert.match(del, /Pharmacy\.deleteOne/);
  assert.match(del, /PharmacyDocumentFile\.deleteMany/);
  assert.match(del, /appendAdminAuditLog/);
});

//===================================================================

test('reactivation remains blocked until the administrator approves', () => {
  const svc = s('pharmacy-owner-reactivation.service.ts');

  assert.match(svc, /PHARMACY_STATUSES\.BLOCKED/);
  assert.match(svc, /status: PHARMACY_STATUSES\.ON_REACTIVATION/);
  assert.match(svc, /reviewState: 'pending'/);
  assert.doesNotMatch(svc, /status: PHARMACY_STATUSES\.ACTIVE/);
  assert.match(actions, /Request reactivation/);
});
