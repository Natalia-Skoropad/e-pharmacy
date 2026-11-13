import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('owner-wide client comments use the existing opt-in BFF route, not pharmacy comments', () => {
  const controller = read('controllers/pharmacies/pharmacy-note.controller.ts');
  const routes = read('routes/pharmacies/pharmacy-note.routes.ts');
  const schema = read('schemas/pharmacies/pharmacy-note.schema.ts');

  assert.match(
    schema,
    /scope: z\.enum\(\['client', 'product'\]\)\.optional\(\)/
  );

  assert.match(routes, /query: clientNoteScopeQuerySchema/);
  assert.match(controller, /query\.scope === 'client'/);
  assert.match(controller, /getClientCardNotesService/);
  assert.match(controller, /createClientCardNoteService/);
  assert.match(controller, /deleteClientCardNoteService/);
  assert.match(controller, /: await getPharmacyNotesService/);
  assert.match(controller, /: await createPharmacyNoteService/);
  assert.match(controller, /: await deletePharmacyNoteService/);
});

//===============================================================

test('comments use Clients access at the owner boundary, not selected or assigned pharmacy', () => {
  const service = read('services/clients/client-note.service.ts');

  assert.match(service, /listUserPharmacyMemberships\(actor\.id\)/);

  assert.match(
    service,
    /canPharmacyMembershipUseCapability\(member\.membershipRole, 'read_clients'\)/
  );

  assert.doesNotMatch(
    service,
    /'manage_internal_notes'|'read_internal_notes'|getSelectedPharmacyId/
  );

  assert.match(service, /grantedOwnerIds/);
  assert.match(service, /ownerId: \{ \$in: activeOwners\.map/);
  assert.match(service, /client\.isDefaultPharmacyClient/);
  assert.match(service, /defaultPharmacyId/);
  assert.match(service, /Order\.distinct\('pharmacyId'/);
  assert.match(service, /ownerIdsForClient/);
  assert.match(service, /ownerIdsForClient\.includes\(actor\.id\)/);
  assert.match(service, /owner context is ambiguous/);
  assert.match(service, /status: \{ \$ne: PHARMACY_STATUSES\.BLOCKED \}/);
  assert.match(service, /status: \{ \$ne: USER_STATUSES\.BLOCKED \}/);
});

//===============================================================

test('new client-card comments are owner-scoped; legacy pharmacy notes remain readable', () => {
  const service = read('services/clients/client-note.service.ts');
  const model = read('models/pharmacies/pharmacyNote.model.ts');

  assert.match(service, /ownerId: scope\.ownerObjectId, entityType: 'client'/);
  assert.match(service, /ownerId: scope\.ownerObjectId/);
  assert.match(service, /ownerId: \{ \$exists: false \}/);
  assert.match(service, /pharmacyId: \{ \$in: scope\.legacyPharmacyIds \}/);
  assert.match(service, /ownerNoteReplayFilter/);
  assert.match(service, /noteFilter\(scope\)/);
  assert.match(model, /ownerId\?: Schema\.Types\.ObjectId/);
  assert.match(model, /return !this\.ownerId/);
  assert.match(model, /owner_client_comment_idempotency/);

  assert.match(
    model,
    /\['client', 'product'\]\.includes\(this\.entityType\) && !this\.pharmacyId/
  );
});

//===============================================================

test('create and delete are audited as owner activity without comments or pharmacy IDs', () => {
  const service = read('services/clients/client-note.service.ts');

  const activity = service.slice(
    service.indexOf('async function appendClientCommentActivity'),
    service.indexOf('async function supportsClientNoteTransactions')
  );

  assert.match(activity, /appendAdminAuditLog\(/);
  assert.match(activity, /CLIENT_COMMENT_AUDIT_EVENTS\.CREATED/);
  assert.match(activity, /CLIENT_COMMENT_AUDIT_EVENTS\.DELETED/);
  assert.match(activity, /\.\.\.auditEvent/);

  assert.match(
    activity,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(activity, /scopeEntityId: input\.ownerId/);

  assert.doesNotMatch(
    activity,
    /text:|input\.text|note\.text|pharmacyId: input\.pharmacyId/
  );

  assert.match(activity, /changedFields: \['exists', 'clientId', 'actorId'\]/);
});

//===============================================================

test('replica sets can use transactions; standalone compensates unaudited writes', () => {
  const service = read('services/clients/client-note.service.ts');

  assert.match(service, /isUnsupportedMongoTransaction/);
  assert.match(service, /transaction numbers are only allowed/);
  assert.match(service, /code === 263/);

  assert.match(
    service,
    /runClientNoteMutation\(async \(session, compensate\) =>/
  );

  assert.match(service, /if \(compensate\)[\s\S]*?PharmacyNote\.deleteOne/);

  assert.match(
    service,
    /if \(compensate\)[\s\S]*?PharmacyNote\.collection\.insertOne/
  );

  assert.match(service, /database\.admin\(\)\.command\(\{ hello: 1 \}\)/);
  assert.match(service, /if \(!\(await supportsClientNoteTransactions\(\)\)\)/);
  assert.match(service, /await mutation\(undefined, true\)/);
  assert.doesNotMatch(service, /fallbackSession/);

  const auditWriter = read('services/admin/audit/admin-audit-write.service.ts');

  assert.match(auditWriter, /session\?: ClientSession/);
  assert.match(auditWriter, /\.session\(session \?\? null\)/);
  assert.match(auditWriter, /session \? \{ session \} : \{\}/);
});
