import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const modelSource = read('src/models/pharmacyOwnerAdminComment.model.ts');
const schemaSource = read('src/schemas/pharmacy-owner-admin-comment.schema.ts');

const serviceSource = read(
  'src/services/pharmacy-owner-admin-comment.service.ts'
);

const adminRouteSource = read('src/routes/admin.routes.ts');
const ownerRouteSource = read('src/routes/pharmacy-owner.routes.ts');

const sharedTypesSource = read(
  '../../packages/types/src/admin/pharmacy-owner-comment.ts'
);

const sharedTypesIndex = read('../../packages/types/src/admin/index.ts');

//===============================================================

test('owner admin comments are a separate admin-only persistence domain', () => {
  assert.match(modelSource, /ownerUserId:[\s\S]*immutable:\s*true/);
  assert.match(modelSource, /createdByAdminUserId:[\s\S]*immutable:\s*true/);
  assert.match(modelSource, /authorNameSnapshot/);
  assert.match(modelSource, /clientRequestId/);
  assert.match(modelSource, /model<PharmacyOwnerAdminCommentEntity>/);
  assert.doesNotMatch(modelSource, /AdminEmployeePrivateNote|PharmacyNote/);

  assert.match(
    modelSource,
    /\{ createdByAdminUserId: 1, clientRequestId: 1 \},\s*\{ unique: true \}/
  );
});

//===============================================================

test('comment routes enforce admin-only visibility and pharmacyOwners permissions', () => {
  assert.match(
    adminRouteSource,
    /adminRoutes\.use\([\s\S]*authenticate,[\s\S]*authorizeRoles\(USER_ROLES\.ADMIN\)[\s\S]*resolveAdminAuthorization/
  );

  assert.match(
    adminRouteSource,
    /adminRoutes\.get\(\s*['"]\/pharmacy-owners\/:ownerId\/comments['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.view[\s\S]*?listPharmacyOwnerAdminCommentsByAdmin/
  );

  assert.match(
    adminRouteSource,
    /adminRoutes\.post\(\s*['"]\/pharmacy-owners\/:ownerId\/comments['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.edit[\s\S]*?createPharmacyOwnerAdminCommentByAdmin/
  );

  assert.match(
    adminRouteSource,
    /adminRoutes\.delete\(\s*['"]\/pharmacy-owners\/:ownerId\/comments\/:commentId['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.edit[\s\S]*?deletePharmacyOwnerAdminCommentByAdmin/
  );

  assert.doesNotMatch(ownerRouteSource, /admin.?comment|comments/i);
});

//===============================================================

test('comment creation is strict and idempotent by clientRequestId', () => {
  assert.match(
    schemaSource,
    /clientRequestId:\s*z\.string\(\)\.trim\(\)\.uuid\(\)/
  );

  assert.match(
    schemaSource,
    /createPharmacyOwnerAdminCommentSchema[\s\S]*?\.strict\(\)/
  );

  assert.match(serviceSource, /findCommentReplay\(/);
  assert.match(serviceSource, /assertReplayMatches\(/);
  assert.match(serviceSource, /error\.code === 11000/);
  assert.match(serviceSource, /createdByAdminUserId:\s*adminUserId/);
  assert.match(serviceSource, /clientRequestId/);
});

//===============================================================

test('comment reads and deletes stay scoped to the owner route', () => {
  assert.match(
    serviceSource,
    /PharmacyOwnerAdminComment\.find\(\{ ownerUserId \}\)/
  );

  assert.match(
    serviceSource,
    /PharmacyOwnerAdminComment\.findOneAndDelete\(\s*\{[\s\S]*?_id: commentId,[\s\S]*?ownerUserId,[\s\S]*?\},\s*\{ session \}/
  );

  assert.doesNotMatch(serviceSource, /findById\(commentId\)/);

  assert.match(
    serviceSource,
    /User\.exists\(\{[\s\S]*?_id: ownerUserId,[\s\S]*?role: USER_ROLES\.PHARMACY/
  );
});

//===============================================================

test('comment create and delete audit atomically and delete preserves original text', () => {
  assert.equal(
    (serviceSource.match(/session\.withTransaction/g) ?? []).length,
    2
  );

  assert.equal((serviceSource.match(/appendAdminAuditLog\(/g) ?? []).length, 2);
  assert.match(serviceSource, /PHARMACY_OWNER_COMMENT_CREATED/);
  assert.match(serviceSource, /PHARMACY_OWNER_COMMENT_DELETED/);

  assert.match(
    serviceSource,
    /entityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER_COMMENT/
  );

  assert.match(
    serviceSource,
    /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(serviceSource, /scopeEntityId:\s*ownerUserId/);

  const snapshotStart = serviceSource.indexOf('function auditSnapshot');

  const snapshotEnd = serviceSource.indexOf(
    '//===============================================================',
    snapshotStart + 1
  );

  const snapshotSource = serviceSource.slice(snapshotStart, snapshotEnd);

  assert.match(snapshotSource, /text:\s*comment\.text/);
  assert.match(snapshotSource, /createdByAdminUserId/);
  assert.match(snapshotSource, /authorName/);
  assert.match(snapshotSource, /createdAt/);

  assert.match(
    serviceSource,
    /PHARMACY_OWNER_COMMENT_DELETED[\s\S]*?before:\s*auditSnapshot\(comment\)[\s\S]*?after:\s*\{ exists: false \}/
  );

  assert.match(
    serviceSource,
    /actorUserId:\s*adminUserId,[\s\S]*?PHARMACY_OWNER_COMMENT_DELETED/
  );
});

//===============================================================

test('shared Admin owner comment contracts are ready for the later BFF stage', () => {
  for (const typeName of [
    'AdminPharmacyOwnerComment',
    'AdminPharmacyOwnerCommentsResponse',
    'AdminPharmacyOwnerCommentResponse',
    'CreateAdminPharmacyOwnerCommentPayload',
  ]) {
    assert.match(sharedTypesSource, new RegExp(`export type ${typeName}\\b`));
  }

  assert.match(
    sharedTypesIndex,
    /export type \* from ['"]\.\/pharmacy-owner-comment['"]/
  );
});
