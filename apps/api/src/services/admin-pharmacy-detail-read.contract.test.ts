import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

//===================================================================

test('Stage 14.5 backend detail has explicit permission and validated ID', () => {
  const routes = read('../routes/admin.routes.ts');
  const schema = read('../schemas/admin.schema.ts');
  const controller = read('../controllers/admin.controller.ts');

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view[\s\S]*?pharmacyIdParamsSchema[\s\S]*?getPharmacyDetailByAdmin/
  );

  assert.match(
    schema,
    /pharmacyIdParamsSchema = z\.object\(\{\s*pharmacyId: mongoIdSchema/
  );

  assert.match(controller, /getAdminPharmacyDetailService/);

  assert.match(
    controller,
    /getPharmacyDetailByAdmin[\s\S]*?Cache-Control', 'no-store'/
  );
});

//===================================================================

test('Stage 14.5 missing pharmacies return 404, no data written, owner link uses role', () => {
  const service = read('./admin-pharmacy-detail-read.service.ts');

  assert.match(service, /HTTP_STATUS\.NOT_FOUND/);

  assert.match(
    service,
    /User\.findOne\(\{ _id: pharmacy\.ownerId, role: USER_ROLES\.PHARMACY \}\)/
  );

  assert.match(service, /buildPagedPharmacyItemsPipeline\(0, 1\)/);
  assert.match(service, /bankTransferAvailable\(bankDetails\)/);
  assert.match(service, /documents\?\.length \?\? 0/);
  assert.match(service, /updatedAt: timestamp\(/);
  assert.doesNotMatch(service, /\.save\(|\.updateOne\(|\.findOneAndUpdate\(/);
});

//===================================================================

test('Stage 14.5 separates current/pending and never serializes raw document fields', () => {
  const service = read('./admin-pharmacy-detail-read.service.ts');
  const index = read('../../../../packages/types/src/admin/index.ts');

  assert.match(service, /function publishedData\(/);
  assert.match(service, /function submittedChanges\(/);
  assert.match(service, /BANK_FIELDS/);
  assert.doesNotMatch(service, /\{ \.\.\.pending \}/);
  assert.match(index, /'\.\/pharmacy-detail'/);
});
