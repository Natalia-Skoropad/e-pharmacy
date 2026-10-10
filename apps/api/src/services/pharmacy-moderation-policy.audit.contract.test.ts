import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

// Stage 14.1: read-only regression audit of existing guarantees.
// Known policy gaps are documented in apps/admin/README-14.1.md;
// these tests do not pretend Stage 14.2/14.3 mutations exist.

const root = resolve(process.cwd(), 'src');

//===============================================================

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8');
}

//===============================================================

test('pharmacy domain remains five-status and on_moderation operational', async () => {
  const [auth, operational, profile] = await Promise.all([
    source('constants/auth.ts'),
    source('constants/pharmacy-status.ts'),
    source('constants/pharmacy-profile.ts'),
  ]);

  const statuses = auth.match(
    /export const PHARMACY_STATUSES = \{([\s\S]*?)\} as const;/
  )?.[1];

  assert.ok(statuses, 'canonical statuses should be declared');

  assert.deepEqual(
    [...statuses.matchAll(/^\s*[A-Z_]+:\s*'([^']+)'/gm)].map((item) => item[1]),
    ['new', 'on_verification', 'on_moderation', 'active', 'blocked']
  );

  assert.match(
    operational,
    /PHARMACY_STATUSES\.ACTIVE,[\s\S]*PHARMACY_STATUSES\.ON_MODERATION/
  );

  assert.match(profile, /new:\s*\['edit',\s*'submit_for_verification'\]/);
  assert.match(profile, /on_verification:\s*\[\]/);
  assert.match(profile, /on_moderation:\s*\[\]/);
  assert.match(profile, /active:\s*\['edit',\s*'submit_for_moderation'\]/);
  assert.match(profile, /blocked:\s*\[\]/);
});

//===============================================================

test('registration yields new owner/new pharmacy, not an accidental public pharmacy', async () => {
  const [registration, accountStatus] = await Promise.all([
    source('services/auth.service.ts'),
    source('utils/account-status.ts'),
  ]);

  assert.match(
    accountStatus,
    /role === USER_ROLES\.PHARMACY[\s\S]*?USER_STATUSES\.NEW/
  );

  assert.match(registration, /Pharmacy\.create\([\s\S]*?status:\s*'new'/);
  assert.match(registration, /claimRegistrationPharmacyDocuments/);
});

//===============================================================

test('client public pharmacy list/detail and checkout keep pending fields unpublished', async () => {
  const service = await source('services/pharmacy.service.ts');

  const listToProfile = service.slice(
    service.indexOf('function serializePharmacyCardSummary'),
    service.indexOf('function serializeCurrentPharmacySummary')
  );

  assert.doesNotMatch(listToProfile, /pendingModeration/);

  assert.match(
    service,
    /const PUBLIC_PHARMACY_STATUSES\s*=\s*\[\s*PHARMACY_STATUSES\.ACTIVE,\s*PHARMACY_STATUSES\.ON_MODERATION/
  );

  assert.match(
    service,
    /getPharmaciesService\([\s\S]*?status:\s*PUBLIC_PHARMACY_STATUS_FILTER/
  );

  assert.match(
    service,
    /getPharmacyDetailsService\([\s\S]*?status:\s*PUBLIC_PHARMACY_STATUS_FILTER/
  );

  assert.match(
    service,
    /getPharmacyCheckoutDetailsService\([\s\S]*?status:\s*PUBLIC_PHARMACY_STATUS_FILTER/
  );
});

//===============================================================

test('owner cascade checks all linked pharmacies for in-flight orders and does not auto-unblock them', async () => {
  const [lifecycle, lifecycleConstants] = await Promise.all([
    source('services/pharmacy-owner-lifecycle.service.ts'),
    source('constants/pharmacy-owner-lifecycle.ts'),
  ]);

  assert.match(
    lifecycleConstants,
    /PHARMACY_OWNER_ACTIVE_ORDER_STATUSES = \[\s*'new',\s*'in_progress'/
  );

  assert.match(
    lifecycle,
    /Order\.countDocuments\(\{[\s\S]*?pharmacyId:\s*\{\s*\$in:\s*pharmacies\.map/
  );

  assert.match(
    lifecycle,
    /if \(input\.status === USER_STATUSES\.BLOCKED\) \{[\s\S]*?await assertOwnerHasNoActiveOrders\(pharmacies, session\)/
  );

  const unblockBranch = lifecycle.slice(
    lifecycle.indexOf('} else {\n        // Reactivating an owner')
  );

  assert.match(unblockBranch, /owner\.status = USER_STATUSES\.ACTIVE/);

  assert.doesNotMatch(
    unblockBranch.split('await appendOwnerStatusAudit')[0],
    /Pharmacy\.updateMany/
  );
});

//===============================================================

test('admin pharmacy status endpoint uses pharmacies.moderate backend permission', async () => {
  const [routes, permissions] = await Promise.all([
    source('routes/admin.routes.ts'),
    source('constants/admin-permissions.ts'),
  ]);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/status',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(permissions, /pharmacies:\s*\['view',\s*'edit',\s*'moderate'\]/);
});

//===============================================================

test('owner profile revisions isolate pending changes and on_moderation submit remains atomic', async () => {
  const profile = await source('services/pharmacy.service.ts');

  assert.match(
    profile,
    /updateMyPharmacyProfileService[\s\S]*?mongoSession\.withTransaction/
  );

  assert.match(
    profile,
    /updateMyPharmacyProfileService[\s\S]*?pendingModeration,[\s\S]*?updatedAt:\s*new Date\(expectedRevision\)/
  );

  assert.match(
    profile,
    /submitMyPharmacyModerationService[\s\S]*?status:\s*PHARMACY_STATUSES\.ON_MODERATION/
  );

  assert.match(
    profile,
    /sendMyPharmacyForVerificationService[\s\S]*?assertReadyForVerification\(pharmacy\)/
  );
});

//===============================================================

test('first-activation timestamp is preserved in existing admin status service', async () => {
  const admin = await source('services/admin.service.ts');

  assert.match(admin, /activatedAt:\s*pharmacy\.activatedAt \?\? approvedAt/);
  assert.match(admin, /unsetFields\.pendingModeration = ''/);
  assert.match(admin, /activateNewPharmacyOwnerForPharmacy/);
});
