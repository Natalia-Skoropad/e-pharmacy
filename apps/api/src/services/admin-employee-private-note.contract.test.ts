import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

const modelSource = readSource('models/adminEmployeePrivateNote.model.ts');
const schemaSource = readSource('schemas/admin-employee-note.schema.ts');
const serviceSource = readSource('services/admin-employee-note.service.ts');
const routeSource = readSource('routes/admin.routes.ts');

//===============================================================

test('admin private comments are a separate self-owned persistence domain', () => {
  assert.match(modelSource, /ownerUserId:[\s\S]*immutable:\s*true/);
  assert.match(modelSource, /clientRequestId:/);

  assert.match(
    modelSource,
    /\{ ownerUserId: 1, clientRequestId: 1 \},\s*\{ unique: true \}/
  );

  assert.match(modelSource, /model<AdminEmployeePrivateNoteEntity>/);
  assert.doesNotMatch(modelSource, /PharmacyNote/);

  assert.match(serviceSource, /const filter = \{ ownerUserId: userId \}/);

  assert.match(
    serviceSource,
    /AdminEmployeePrivateNote\.findOneAndDelete\(\{[\s\S]*_id: commentId,[\s\S]*ownerUserId: userId,[\s\S]*\}\)/
  );

  assert.doesNotMatch(serviceSource, /findById\(commentId\)/);
  assert.doesNotMatch(serviceSource, /isPlatformOwner/);
});

//===============================================================

test('admin private comment routes are self-only and do not expose another employee target', () => {
  assert.match(routeSource, /'\/employees\/me\/comments'/);
  assert.match(routeSource, /'\/employees\/me\/comments\/:commentId'/);
  assert.doesNotMatch(routeSource, /employees\/:employeeId\/comments/);
  assert.doesNotMatch(routeSource, /employees\/:userId\/comments/);
});

//===============================================================

test('private comment creation is strict and idempotent by clientRequestId', () => {
  assert.match(
    schemaSource,
    /clientRequestId:\s*z\.string\(\)\.trim\(\)\.uuid\(\)/
  );

  assert.match(
    schemaSource,
    /createAdminEmployeePrivateNoteSchema[\s\S]*\.strict\(\)/
  );

  assert.match(serviceSource, /findPrivateNoteReplay\(/);
  assert.match(serviceSource, /assertReplayMatches\(/);
  assert.match(serviceSource, /error\.code === 11000/);

  assert.match(
    serviceSource,
    /ownerUserId: userId,[\s\S]*clientRequestId: input\.clientRequestId/
  );
});

//===============================================================

test('private comments never write to the global Admin AuditLog', () => {
  assert.doesNotMatch(serviceSource, /appendAdminAuditLog/);
  assert.doesNotMatch(serviceSource, /ADMIN_AUDIT_ACTIONS/);
  assert.doesNotMatch(serviceSource, /AdminAuditLog/);
});
