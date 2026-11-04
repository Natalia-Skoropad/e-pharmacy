import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// Run from the API package root, or from the monorepo root.
const currentDirectory = process.cwd();

//===================================================================

const root =
  basename(currentDirectory) === 'api' &&
  basename(dirname(currentDirectory)) === 'apps'
    ? resolve(currentDirectory, '../..')
    : currentDirectory;

//===================================================================

const read = (path: string): string =>
  readFileSync(resolve(root, path), 'utf8');

//===================================================================

const service = read('apps/api/src/services/admin/pharmacies/admin.service.ts');

const owner = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-reactivation.service.ts'
);

const profile = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-profile.service.ts'
);

const permissions = read(
  'apps/api/src/constants/pharmacies/pharmacy-profile.ts'
);

const menu = read(
  'apps/admin/src/lib/pharmacies/pharmacy-moderation-actions.ts'
);

const adminActions = read(
  'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
);

const ownerActions = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
);

const editor = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
);

//===================================================================

test('Blocked pharmacy saves proposed changes without changing published fields', () => {
  assert.match(permissions, /blocked: \['edit'\]/);
  assert.match(profile, /const isReactivationDraft =/);
  assert.match(profile, /pendingModeration,\s*updatedBy: userId/);
  assert.match(profile, /if \(isReactivationDraft\) \{\s*throw httpError\(/);
  assert.match(profile, /missingRequiredModerationFields/);
});

//===================================================================

test('Reactivation submission is validated and immutable until Admin review', () => {
  assert.match(owner, /pharmacy\.reviewState === 'changes_requested'/);
  assert.match(owner, /missingRequiredModerationFields/);
  assert.match(owner, /PharmacyOwnerDocument\.exists/);
  assert.match(owner, /status: PHARMACY_STATUSES\.ON_REACTIVATION/);
  assert.match(owner, /reviewState: 'pending'/);
  assert.match(ownerActions, /disabled=\{!canCancelReview\}/);
  assert.match(permissions, /status === 'on_reactivation'/);
});

//===================================================================

test('Admin cannot approve Blocked without request or reject reactivation', () => {
  const action = service
    .split("case 'review_reactivation':")[1]
    .split('// Strict CAS')[0];

  assert.match(action, /isReactivation && pharmacy\.reviewState === 'pending'/);
  assert.doesNotMatch(action, /isBlocked|admin_blocked/);
  assert.match(service, /Reject reactivation is no longer available/);
  assert.match(menu, /case 'blocked':[\s\S]*?return \[\]/);
});

//===================================================================

test('Approval always activates and publishes only submitted pending moderation changes', () => {
  const action = service
    .split("case 'review_reactivation':")[1]
    .split('// Strict CAS')[0];

  assert.match(action, /nextStatus = PHARMACY_STATUSES\.ACTIVE/);

  assert.match(
    action,
    /normalizePendingModeration\(pharmacy\.pendingModeration\)/
  );

  assert.match(
    action,
    /nextUpdate\.activatedAt = pharmacy\.activatedAt \?\? approvedAt/
  );

  assert.match(action, /unsetFields\.pendingModeration = ''/);
  assert.match(action, /unsetFields\.reviewState = ''/);
  assert.match(menu, /targetStatus: 'active'/);
});

//===================================================================

test('Admin shows only Approve and Request corrections when submitted; disabled with help after corrections', () => {
  assert.match(menu, /status !== 'on_reactivation'/);
  assert.doesNotMatch(menu, /action: 'reject_reactivation'/);
  assert.match(adminActions, /detail\.status === 'on_reactivation'/);
  assert.match(adminActions, /disabled: true as const/);
  assert.match(adminActions, /<InfoTooltip/);
});

//===================================================================

test('Owner validates edited tab before save, and complete pharmacy before request', () => {
  assert.match(editor, /tabHasErrors\(tab, validation\)/);
  assert.match(editor, /isReactivationDraft \? 'verification' : 'draft'/);
  assert.match(ownerActions, /verificationIncomplete/);
  assert.match(ownerActions, /ownerHasDocuments/);
  assert.match(ownerActions, /cancelReview === 'moderation'/);
});
