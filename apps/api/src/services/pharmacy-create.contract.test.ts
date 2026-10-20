import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (name: string) => readFile(resolve(process.cwd(), name), 'utf8');

//===============================================================

test('private pharmacy creation uses only authenticated pharmacy identity', async () => {
  const [routes, controller, service] = await Promise.all([
    read('src/routes/pharmacy.routes.ts'),
    read('src/controllers/pharmacy.controller.ts'),
    read('src/services/pharmacy-create.service.ts'),
  ]);

  assert.match(
    routes,
    /pharmacyRoutes\.post\(\s*'\/',\s*authenticate,\s*authorizeRoles\(USER_ROLES\.PHARMACY\)/
  );

  assert.match(routes, /validate\(\{ body: createPharmacyDraftSchema \}\)/);
  assert.match(controller, /createPharmacyDraftService\(\s*req\.user\?\.id/);
  assert.match(service, /status: PHARMACY_STATUSES\.NEW/);
  assert.match(service, /managerUserIds: \[\]/);
  assert.match(service, /ownerId: ownerUserId/);
  assert.match(service, /USER_STATUSES\.NEW, USER_STATUSES\.ACTIVE/);
  assert.match(service, /manages && !owns/);
});

//===============================================================

test('draft contract validates provided fields without requiring location or bank details', async () => {
  const schema = await read('src/schemas/pharmacy.schema.ts');

  const slice = schema.slice(
    schema.indexOf('export const createPharmacyDraftSchema'),
    schema.indexOf('export const updateMyPharmacyProfileSchema')
  );

  assert.match(slice, /clientRequestId: z\.string\(\)\.trim\(\)\.uuid\(\)/);
  assert.match(slice, /name: sharedPharmacyNameSchema/);
  assert.match(slice, /pharmacyRegionSchema/);
  assert.match(slice, /pharmacySettlementSchema/);
  assert.match(slice, /sharedRequiredPhoneSchema/);
  assert.match(slice, /sharedWorkingHoursSchema/);
  assert.match(slice, /sharedIbanSchema/);
  assert.match(slice, /\.strict\(\)/);
  assert.doesNotMatch(slice, /ownerId:|managerUserIds:|status:/);
});

//===============================================================

test('idempotent creation and audit are transactional and tenant scoped', async () => {
  const [service, model] = await Promise.all([
    read('src/services/pharmacy-create.service.ts'),
    read('src/models/pharmacy.model.ts'),
  ]);

  assert.match(
    model,
    /unique: true,\s*partialFilterExpression: \{ creationRequestId:/
  );

  assert.match(service, /await Pharmacy\.collection\.createIndex\(/);
  assert.match(service, /session\.withTransaction\(async \(\) =>/);
  assert.match(service, /await Pharmacy\.create\(/);
  assert.match(service, /await appendAdminAuditLog\(/);
  assert.match(service, /action: ADMIN_AUDIT_ACTIONS\.PHARMACY_CREATED/);

  assert.match(
    service,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(service, /createHash\('sha256'\)/);
  assert.match(service, /'PHARMACY_CREATE_REQUEST_CONFLICT'/);
  assert.match(service, /creationRequestId: clientRequestId/);
  assert.doesNotMatch(service, /Pharmacy\.findOne\(\{\s*\$or:/);
});
