import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = path.resolve(process.cwd(), '../..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

const cancellation = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-review-cancellation.service.ts'
);

const reactivation = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-reactivation.service.ts'
);

const admin = read('apps/api/src/services/admin/pharmacies/admin.service.ts');

const deactivation = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-deactivation.service.ts'
);

const ownerHistory = read(
  'apps/api/src/services/pharmacies/pharmacy-lifecycle-history.service.ts'
);

const ownerUI = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
);

//===================================================================

// These tests confirm invariant wiring, not a substitute for MongoDB transactions.
test('owner cannot withdraw while administrator review is pending', () => {
  assert.match(cancellation, /reviewState !== 'changes_requested'/);
  assert.match(cancellation, /PHARMACY_STATUSES\.NEW/);
  assert.match(cancellation, /PHARMACY_STATUSES\.ACTIVE/);
  assert.match(cancellation, /PHARMACY_STATUSES\.BLOCKED/);
  assert.match(cancellation, /PHARMACY_MODERATION_WITHDRAWN/);
  assert.match(cancellation, /appendPharmacyOwnerMutationAudit/);
  assert.match(cancellation, /session\.withTransaction/);
});

//===================================================================

test('reactivation submits the frozen revision only after completeness and owner documents checks', () => {
  assert.match(reactivation, /PHARMACY_STATUSES\.ON_REACTIVATION/);
  assert.match(reactivation, /missingRequiredModerationFields/);
  assert.match(reactivation, /PharmacyOwnerDocument\.exists/);
  assert.match(reactivation, /PHARMACY_REACTIVATION_REQUESTED/);
  assert.match(reactivation, /session\.withTransaction/);
});

//===================================================================

test('admin reacts to reactivation with approval, corrections or rejection and always audits', () => {
  assert.match(admin, /case 'reject_reactivation'/);
  assert.match(admin, /case 'request_corrections'/);
  assert.match(admin, /case 'review_reactivation'/);
  assert.match(admin, /PHARMACY_REACTIVATION_REJECTED/);
  assert.match(admin, /PHARMACY_REACTIVATION_REVIEWED/);
  assert.match(admin, /appendAdminAuditLog/);
  assert.match(admin, /missingRequiredModerationFields/);
  assert.match(admin, /blockSource === 'admin_blocked'/);
});

//===================================================================

test('owner deactivation preserves work restrictions and audit while Admin can emergency block', () => {
  assert.match(deactivation, /countUnfinishedPharmacyWork/);
  assert.match(deactivation, /blockSource: 'owner_deactivated'/);
  assert.match(deactivation, /appendAdminAuditLog/);
  assert.match(admin, /blockSource = 'admin_blocked'/);
});

//===================================================================

test('status log is drawn from canonical audit with member-only read and field projection', () => {
  assert.match(
    ownerHistory,
    /getPharmacyMembership\(userId, pharmacyId, \{ allowBlocked: true \}\)/
  );

  assert.match(ownerHistory, /membershipRole !== 'owner'/);
  assert.match(ownerHistory, /AdminAuditLog\.find/);
  assert.match(ownerHistory, /PHARMACY_REACTIVATION_REJECTED/);
  assert.match(ownerHistory, /PHARMACY_VERIFICATION_WITHDRAWN/);

  assert.match(
    ownerHistory,
    /\.select\('action actorNameSnapshot createdAt reason before\.status after\.status/
  );

  assert.match(
    ownerUI,
    /getOwnedPharmacyLifecycleHistory\(pharmacy\.id, historyPage\)/
  );
});
