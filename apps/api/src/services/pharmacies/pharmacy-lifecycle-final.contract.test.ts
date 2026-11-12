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

const activityUI = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActivityTab.tsx'
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

test('admin only approves a submitted reactivation or requests corrections', () => {
  const reactivate = admin
    .split("case 'review_reactivation':")[1]
    .split('// Strict CAS')[0];

  assert.match(admin, /case 'request_corrections'/);
  assert.match(reactivate, /pharmacy\.reviewState === 'pending'/);
  assert.match(reactivate, /PHARMACY_STATUSES\.ACTIVE/);
  assert.match(reactivate, /unsetFields\.pendingModeration = ''/);
  assert.match(reactivate, /missingRequiredModerationFields/);
  assert.match(admin, /PHARMACY_REACTIVATION_REVIEWED/);
  assert.match(admin, /appendAdminAuditLog/);
  assert.doesNotMatch(reactivate, /blockSource === 'admin_blocked'/);
  assert.match(admin, /Reject reactivation is no longer available/);
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
    /getPharmacyMembership\(\s*userId,\s*pharmacyId,\s*\{\s*allowBlocked:\s*true,?\s*\}\s*\)/
  );

  assert.match(ownerHistory, /membershipRole !== 'owner'/);
  assert.match(ownerHistory, /AdminAuditLog\.find/);
  assert.match(ownerHistory, /PHARMACY_REACTIVATION_REJECTED/);
  assert.match(ownerHistory, /PHARMACY_VERIFICATION_WITHDRAWN/);
  assert.match(ownerHistory, /recoverBlockSourceFromStatusChange/);
  assert.match(ownerHistory, /resolvePreviousPharmacyBlockSources/);
  assert.match(ownerHistory, /historicalSources\.get\(String\(entry\._id\)\)/);
  assert.match(reactivation, /blockSource: pharmacy\.blockSource \?\? null/);
  assert.match(reactivation, /blockSource: updated\.blockSource \?\? null/);

  const provenanceBadge = read(
    'packages/ui/src/statistics/PharmacyBlockSourceBadge/PharmacyBlockSourceBadge.tsx'
  );

  assert.doesNotMatch(provenanceBadge, /Blocking source not recorded/i);

  const auditRead = read(
    'apps/api/src/services/admin/audit/admin-audit-read.service.ts'
  );

  assert.match(auditRead, /resolvePreviousPharmacyBlockSources/);

  assert.match(
    ownerHistory,
    /\.select\(\s*'action actorUserId actorNameSnapshot createdAt reason before\.status after\.status before\.reviewState after\.reviewState before\.blockSource after\.blockSource'\s*\)/
  );

  assert.match(ownerUI, /getOwnedPharmacyLifecycleHistory\(pharmacy\.id, 1\)/);

  assert.match(
    activityUI,
    /getOwnedPharmacyLifecycleHistory\(pharmacyId, page\)/
  );

  assert.match(activityUI, /setHasMore\(result\.hasMore\)/);
});
