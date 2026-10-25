import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

const model = read('models/owners/pharmacyUserPrivateNote.model.ts');
const schema = read('schemas/pharmacies/pharmacy-user-private-note.schema.ts');
const service = read('services/owners/pharmacy-user-private-note.service.ts');
const controller = read('controllers/owners/pharmacy-user-private-note.controller.ts');
const routes = read('routes/owners/pharmacy-owner.routes.ts');
const authRoutes = read('routes/auth/auth.routes.ts');
const authService = read('services/auth/auth-profile.service.ts');

//===============================================================

test('private profile is backed by the User independently of any pharmacy', () => {
  assert.match(model, /ownerUserId:[\s\S]*immutable:\s*true/);
  assert.match(model, /ref: 'User'/);

  assert.match(
    model,
    /\{ ownerUserId: 1, clientRequestId: 1 \},\s*\{ unique: true \}/
  );

  assert.doesNotMatch(model, /pharmacyId|managerUserIds|PharmacyNote/);

  assert.match(service, /const filter = \{ ownerUserId: userId \}/);

  assert.match(
    service,
    /PharmacyUserPrivateNote\.findOneAndDelete\(\{[\s\S]*_id: commentId,[\s\S]*ownerUserId: userId/
  );

  assert.doesNotMatch(
    service,
    /Pharmacy\.find|managerUserIds|findById\(commentId\)/
  );
});

//===============================================================

test('authenticated pharmacy users can only use their own comment routes', () => {
  assert.match(
    routes,
    /pharmacyOwnerRoutes\.use\(authenticate, authorizeRoles\(USER_ROLES\.PHARMACY\)\)/
  );

  assert.match(routes, /'\/me\/comments'/);
  assert.match(routes, /'\/me\/comments\/:commentId'/);

  assert.doesNotMatch(
    routes,
    /\/owners\/:ownerId\/comments|\/employees\/:employeeId\/comments/
  );

  assert.match(controller, /req\.user\.id/);
  assert.doesNotMatch(controller, /req\.params\.userId|req\.body\.ownerUserId/);
});

//===============================================================

test('private notes enforce strict pagination, input and idempotency', () => {
  assert.match(schema, /positivePageSchema/);

  assert.match(
    schema,
    /createPerPageSchema\(\{ defaultValue: 10, max: 100 \}\)/
  );

  assert.match(schema, /clientRequestId: z\.string\(\)\.trim\(\)\.uuid\(\)/);

  assert.match(
    schema,
    /createPharmacyUserPrivateNoteSchema[\s\S]*?\.strict\(\)/
  );

  assert.match(service, /findReplay\(userId, input\.clientRequestId\)/);
  assert.match(service, /assertReplayMatches\(/);
  assert.match(service, /hasMongoDuplicateKeyCode\(error\)/);
  assert.match(service, /\.sort\(\{ createdAt: -1, _id: -1 \}\)/);
  assert.match(service, /Math\.min\(page, totalPages\)/);
});

//===============================================================

test('personal comments never enter audit or a pharmacy-scoped data store', () => {
  assert.doesNotMatch(
    service + controller + model,
    /AdminAuditLog|appendAdminAuditLog|auditRequestId|PharmacyNote/
  );

  assert.match(controller, /Cache-Control', 'private, no-store'/);
});

//===============================================================

test('personal information, password and sessions reuse shared authenticated user API', () => {
  assert.match(authRoutes, /'\/current', authenticate/);
  assert.match(authRoutes, /'\/current\/password'/);
  assert.match(authRoutes, /'\/sessions', authenticate/);
  assert.match(authRoutes, /'\/sessions\/:sessionId'/);
  assert.match(authService, /const isPharmacyOwner = await User\.exists\(/);
  assert.match(authService, /updatePharmacyOwnerUserProfileWithAudit/);
});
