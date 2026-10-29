import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFile(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('one permissioned canonical endpoint with required reason, CAS and idempotency key', async () => {
  const [routes, schema, service] = await Promise.all([
    read('routes/admin/admin.routes.ts'),
    read('schemas/admin/admin.schema.ts'),
    read('services/admin/pharmacies/admin.service.ts'),
  ]);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/moderation-decisions',[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(
    schema,
    /action:\s*z\.enum\(\s*\[\s*'approve',\s*'request_corrections',\s*'block',\s*'review_reactivation',\s*'reject_reactivation',?\s*\]\s*\)/
  );

  assert.match(schema, /reason: pharmacyModerationReason/);
  assert.match(schema, /expectedRevision: pharmacyModerationRevision/);
  assert.match(schema, /clientRequestId: pharmacyModerationMutationKey/);

  assert.match(
    service,
    /export async function decidePharmacyModerationByAdminService/
  );

  assert.match(service, /session\.withTransaction/);
  assert.match(service, /updatedAt: expectedDate/);
  assert.match(service, /mutationKey: input\.clientRequestId/);
  assert.match(service, /await appendAdminAuditLog\(/);

  assert.match(
    service,
    /if \(!pharmacy\.activatedAt && nextStatus === PHARMACY_STATUSES\.ACTIVE\)/
  );
});

//===============================================================

test('all legacy routes delegate to the canonical decision service', async () => {
  const service = await read('services/admin/pharmacies/admin.service.ts');

  const wrappers = service.split(
    'export async function requestPharmacyCorrectionsByAdminService'
  )[1];

  assert.equal(
    (wrappers.match(/return decidePharmacyModerationByAdminService\(/g) ?? [])
      .length,
    2
  );

  assert.match(
    service,
    /case 'request_corrections':[\s\S]*?nextUpdate\.reviewFeedback = reason/
  );

  assert.match(
    service,
    /case 'block':[\s\S]*?nextUpdate\.blockSource = 'admin_blocked'/
  );

  assert.match(
    service,
    /case 'review_reactivation':[\s\S]*?assertPharmacyOwnerCanOperate\(pharmacy\.ownerId, session\)/
  );

  assert.match(
    service,
    /nextStatus\s*=\s*pharmacy\.activatedAt\s*\?\s*PHARMACY_STATUSES\.ACTIVE\s*:\s*PHARMACY_STATUSES\.ON_VERIFICATION/
  );

  assert.doesNotMatch(
    service.split("case 'review_reactivation':")[1].split('// Strict CAS')[0],
    /PHARMACY_STATUSES\.ON_MODERATION/
  );
});

//===============================================================

test('owner saves and submissions record only safe metadata in the same transaction', async () => {
  const [ownerProfile, moderation, profileShared, audit, model] =
    await Promise.all([
      read('services/pharmacies/pharmacy-owner-profile.service.ts'),
      read('services/pharmacies/pharmacy-moderation.service.ts'),
      read('services/pharmacies/pharmacy-profile.shared.ts'),
      read('services/admin/audit/admin-audit-write.service.ts'),
      read('models/audit/adminAuditLog.model.ts'),
    ]);

  assert.match(ownerProfile, /PHARMACY_PROFILE_UPDATED/);
  assert.match(moderation, /PHARMACY_MODERATION_SUBMITTED/);

  assert.equal(
    (
      [ownerProfile, moderation]
        .join('\n')
        .match(/await appendPharmacyOwnerMutationAudit\(/g) ?? []
    ).length,
    4
  );

  assert.match(profileShared, /session: ClientSession/);
  assert.match(profileShared, /bankDetails: 'paymentSettings'/);
  assert.match(profileShared, /documents: 'verificationDocuments'/);
  assert.match(audit, /mutationKey: normalizeAuditString/);
  assert.match(model, /audit_entity_mutation_key_unique/);
});
