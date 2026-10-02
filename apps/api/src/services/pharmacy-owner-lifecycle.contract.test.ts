import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

//===================================================================

test('owner lifecycle route is permission-protected and manual activation cannot target new', () => {
  const routes = read('../routes/admin.routes.ts');
  const schema = read('../schemas/admin-pharmacy-owner.schema.ts');

  assert.match(
    routes,
    /patch\(\s*['"]\/pharmacy-owners\/:ownerId\/status['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.edit[\s\S]*?updateAdminPharmacyOwnerStatusSchema[\s\S]*?updatePharmacyOwnerStatusByAdmin/
  );

  assert.match(
    schema,
    /z\.enum\(\[USER_STATUSES\.ACTIVE, USER_STATUSES\.BLOCKED\]\)/
  );

  assert.match(schema, /reason:\s*z\.string\(\)\.trim\(\)\.min\(1/);
  assert.match(schema, /\.max\(500\)/);
  assert.doesNotMatch(schema, /z\.enum\(\[[^\]]*USER_STATUSES\.NEW[^\]]*\]\)/);
});

//===================================================================

test('first pharmacy activation runs owner auto-activation in the same transaction', () => {
  const adminService = read('./admin.service.ts');
  const lifecycle = read('./pharmacy-owner-lifecycle.service.ts');

  assert.match(
    adminService,
    /session\.withTransaction[\s\S]*?input\.status === PHARMACY_STATUSES\.ACTIVE[\s\S]*?activateNewPharmacyOwnerForPharmacy\([\s\S]*?session\s*\)/
  );

  assert.match(
    lifecycle,
    /owner\.status !== USER_STATUSES\.NEW\) return false;[\s\S]*?owner\.status = USER_STATUSES\.ACTIVE/
  );

  assert.match(
    lifecycle,
    /PHARMACY_OWNER_AUTO_ACTIVATION_REASON[\s\S]*?appendOwnerStatusAudit/
  );
});

//===================================================================

test('blocked owner cannot have a linked pharmacy activated and orphan owner references fail closed', () => {
  const lifecycle = read('./pharmacy-owner-lifecycle.service.ts');

  assert.match(
    lifecycle,
    /PHARMACY_OWNER_LIFECYCLE_ERROR_CODES\.OWNER_REFERENCE_INVALID/
  );

  assert.match(
    lifecycle,
    /owner\.status === USER_STATUSES\.BLOCKED[\s\S]*?PHARMACY_OWNER_LIFECYCLE_ERROR_CODES\.OWNER_BLOCKED/
  );
});

//===================================================================

test('owner deactivation guards all linked pharmacies active orders and revokes sessions transactionally', () => {
  const lifecycle = read('./pharmacy-owner-lifecycle.service.ts');

  assert.match(
    lifecycle,
    /Pharmacy\.find\(\{ ownerId: owner\._id \}\)[\s\S]*?session\(session\)/
  );

  assert.match(
    lifecycle,
    /Order\.countDocuments\([\s\S]*?pharmacyId:\s*\{ \$in:[\s\S]*?status:\s*\{ \$in: PHARMACY_OWNER_ACTIVE_ORDER_STATUSES \}/
  );

  assert.match(
    lifecycle,
    /HAS_ACTIVE_ORDERS[\s\S]*?revokeAllUserSessionsService\([\s\S]*?'user_blocked',[\s\S]*?session/
  );
});

//===================================================================

test('owner block cascades to every non-blocked pharmacy while reactivation leaves pharmacy status untouched', () => {
  const lifecycle = read('./pharmacy-owner-lifecycle.service.ts');

  assert.match(
    lifecycle,
    /pharmaciesToBlock = pharmacies\.filter[\s\S]*?Pharmacy\.updateMany\([\s\S]*?PHARMACY_STATUSES\.BLOCKED/
  );

  const reactivationBranch = lifecycle.match(
    /\} else \{[\s\S]*?Reactivat[\s\S]*?owner\.status = USER_STATUSES\.ACTIVE;[\s\S]*?owner\.save\(\{ session \}\);\n\s*\}/
  )?.[0];

  assert.ok(reactivationBranch);
  assert.doesNotMatch(
    reactivationBranch,
    /Pharmacy\.(?:update|updateMany|findByIdAndUpdate)/
  );
});

//===================================================================

test('auth permits new owners but still blocks blocked accounts on login and refresh', () => {
  const auth = read('./auth.service.ts');

  assert.match(
    auth,
    /export async function loginUserService[\s\S]*?user\.status === USER_STATUSES\.BLOCKED[\s\S]*?return buildAuthSessionResult/
  );

  assert.doesNotMatch(
    auth,
    /export async function loginUserService[\s\S]{0,1800}?user\.status === USER_STATUSES\.NEW[\s\S]{0,500}?throw httpError/
  );

  assert.match(
    auth,
    /export async function refreshAuthSessionService[\s\S]*?user\.status === USER_STATUSES\.BLOCKED[\s\S]*?revokedReason: 'user_blocked'/
  );
});

//===================================================================

test('demo pharmacy seed creates real owner users and reuses their ids for pharmacy ownerId', () => {
  const seed = read('../scripts/seed.ts');
  const migration = read('./pharmacy-owner-foundation-migration.service.ts');

  assert.match(seed, /seedDemoPharmacyOwners\(pharmacySeeds\)/);
  assert.match(seed, /seed\.ownerId = owner\._id/);

  assert.match(
    seed,
    /email:\s*`pharmacy\.\$\{pharmacyNumber\}@e-pharmacy\.example\.com`/
  );

  assert.match(
    migration,
    /LEGACY_DEMO_PHARMACY_EMAIL_PATTERN[\s\S]*?users\.insertMany\(candidates/
  );

  assert.doesNotMatch(
    migration,
    /pharmacies\.(?:updateOne|updateMany|findOneAndUpdate|bulkWrite)\(/
  );
});
