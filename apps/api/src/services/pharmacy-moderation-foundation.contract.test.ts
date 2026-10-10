import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const base = resolve(process.cwd(), 'src');
const read = (path: string) => readFile(resolve(base, path), 'utf8');

//===============================================================

test('feedback endpoint is permissioned and cannot silently modify public status', async () => {
  const [routes, admin, schema] = await Promise.all([
    read('routes/admin.routes.ts'),
    read('services/admin.service.ts'),
    read('models/pharmacy.model.ts'),
  ]);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/review\/corrections',[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(
    admin,
    /requestPharmacyCorrectionsByAdminService[\s\S]*?reviewState: 'changes_requested'/
  );

  const feedbackMutation = admin
    .split('export async function requestPharmacyCorrectionsByAdminService')[1]
    .split('export async function updatePharmacyStatusByAdminService')[0];

  assert.doesNotMatch(
    feedbackMutation,
    /pendingModeration:|approvedAt:|activatedAt:|status: PHARMACY_STATUSES\.NEW/
  );

  assert.match(
    feedbackMutation,
    /updatedAt: new Date\(input.expectedRevision\)/
  );

  assert.match(
    schema,
    /reviewState:[\s\S]*?values|reviewState:[\s\S]*?enum: \['pending', 'changes_requested'\]/
  );
});

//===============================================================

test('on_moderation revisions only write pendingModeration; owner resubmits atomically', async () => {
  const [profile, api] = await Promise.all([
    read('services/pharmacy.service.ts'),
    read('services/pharmacy-membership.service.ts'),
  ]);

  const update = profile
    .split('export async function updateMyPharmacyProfileService')[1]
    .split('export async function submitMyPharmacyModerationService')[0];

  assert.match(
    update,
    /isCorrectionDraft[\s\S]*?pendingModeration,[\s\S]*?reviewState: 'changes_requested'/
  );

  const submit = profile
    .split('export async function submitMyPharmacyModerationService')[1]
    .split('export async function sendMyPharmacyForVerificationService')[0];

  assert.match(submit, /isResubmission[\s\S]*?reviewState: 'pending'/);
  assert.match(submit, /reviewFeedback: ''/);
  assert.match(api, /owner\.status === USER_STATUSES\.BLOCKED/);
});

//===============================================================

test('approval retains first activation, blocking retains historic approval and guards orders', async () => {
  const [admin, owner, pharmacy] = await Promise.all([
    read('services/admin.service.ts'),
    read('services/pharmacy-owner-lifecycle.service.ts'),
    read('services/pharmacy.service.ts'),
  ]);

  assert.match(admin, /activatedAt: pharmacy\.activatedAt \?\? approvedAt/);

  assert.match(
    admin,
    /assertPharmacyHasNoActiveOrders\(pharmacy\._id, session\)/
  );

  assert.match(
    admin,
    /assertPharmacyOwnerCanOperate\(pharmacy\.ownerId, session\)/
  );

  assert.match(admin, /reviewState === 'changes_requested'/);

  const block = admin
    .split('// Blocking retains historical approval/activation timestamps')[1]
    .split('const updateQuery')[0];

  assert.doesNotMatch(block, /approvedAt|approvedBy/);
  assert.doesNotMatch(owner, /\$unset:\s*\{\s*approvedBy:/);

  assert.match(
    pharmacy,
    /PUBLIC_PHARMACY_STATUSES\s*=\s*\[\s*PHARMACY_STATUSES\.ACTIVE,\s*PHARMACY_STATUSES\.ON_MODERATION/
  );
});
