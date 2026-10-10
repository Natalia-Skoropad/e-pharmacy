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
    read('routes/admin.routes.ts'),
    read('schemas/admin.schema.ts'),
    read('services/admin.service.ts'),
  ]);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/moderation-decisions',[\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(
    schema,
    /action: z\.enum\(\['approve', 'request_corrections', 'block', 'review_reactivation'\]\)/
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
  assert.match(service, /if \(!pharmacy\.activatedAt\)/);
});

//===============================================================

test('all legacy routes delegate to the canonical decision service', async () => {
  const service = await read('services/admin.service.ts');

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
    /case 'block':[\s\S]*?assertPharmacyHasNoActiveOrders\(pharmacy\._id, session\)/
  );

  assert.match(
    service,
    /case 'review_reactivation':[\s\S]*?assertPharmacyOwnerCanOperate\(pharmacy\.ownerId, session\)/
  );

  assert.match(
    service,
    /pharmacy\.activatedAt \? PHARMACY_STATUSES\.ACTIVE : PHARMACY_STATUSES\.ON_VERIFICATION/
  );

  assert.doesNotMatch(
    service.split("case 'review_reactivation':")[1].split('// Strict CAS')[0],
    /PHARMACY_STATUSES\.ON_MODERATION/
  );
});

//===============================================================

test('owner saves and submissions record only safe metadata in the same transaction', async () => {
  const [owner, audit, model] = await Promise.all([
    read('services/pharmacy.service.ts'),
    read('services/admin-audit.service.ts'),
    read('models/adminAuditLog.model.ts'),
  ]);

  assert.match(owner, /PHARMACY_PROFILE_UPDATED/);
  assert.match(owner, /PHARMACY_MODERATION_SUBMITTED/);

  assert.equal(
    (owner.match(/await appendPharmacyOwnerMutationAudit\(/g) ?? []).length,
    4
  );

  assert.match(owner, /session: ClientSession/);
  assert.match(owner, /bankDetails: 'paymentSettings'/);
  assert.match(owner, /documents: 'verificationDocuments'/);
  assert.match(audit, /mutationKey: normalizeAuditString/);
  assert.match(model, /audit_entity_mutation_key_unique/);
});
