import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// The API test runner executes from apps/api; avoid import.meta (CJS type-check) and __dirname (ESM loader).
const auditDirectory = resolve(process.cwd(), 'src/services/admin/audit');

const read = (relativePath: string) =>
  readFile(resolve(auditDirectory, relativePath), 'utf8');

//===================================================================

test('historical pharmacy photo archives are transactional, private and retained with the audit', async () => {
  const [writer, photoService, model, routes, readService] = await Promise.all([
    read('./admin-audit-write.service.ts'),
    read('./admin-audit-photo.service.ts'),
    read('../../../models/audit/adminAuditPhoto.model.ts'),
    read('../../../routes/admin/admin.routes.ts'),
    read('./admin-audit-read.service.ts'),
  ]);

  assert.match(writer, /appendAuditPharmacyPhotos/);
  assert.match(writer, /auditLogId: auditLog\._id/);
  assert.match(photoService, /MAX_PHOTO_BYTES = 450 \* 1024/);
  assert.match(photoService, /buildPharmacyAuditScopeFilter/);
  assert.match(photoService, /AdminAuditLog\.findOne/);
  assert.match(photoService, /createHash\('sha256'\)/);
  assert.match(photoService, /matchingLegacyAuditPhoto/);
  assert.match(model, /admin_audit_photo_retention_ttl/);
  assert.match(model, /auditLogId: 1, side: 1/);
  assert.match(routes, /\/audit\/:auditLogId\/photos\/:side/);

  assert.match(
    routes,
    /\/pharmacies\/:pharmacyId\/activity\/:auditLogId\/photos\/:side/
  );

  assert.match(routes, /ADMIN_PERMISSIONS\.audit\.view/);
  assert.match(routes, /ADMIN_PERMISSIONS\.pharmacies\.view/);
  assert.match(readService, /getAdminAuditPhotoSides/);
  assert.match(readService, /getRecoverableLegacyAuditPhotoSides/);
});

//===================================================================

test('pharmacy photo upload errors use the shared PictureCard styling from Working hours', async () => {
  const [editor, pictureCard, styles, hours] = await Promise.all([
    read(
      '../../../../../pharmacy/src/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditorTabContent.tsx'
    ),

    read('../../../../../../packages/ui/src/media/PictureCard/PictureCard.tsx'),

    read(
      '../../../../../../packages/ui/src/media/PictureCard/PictureCard.module.css'
    ),

    read(
      '../../../../../../packages/ui/src/profile/WorkingHoursInput/WorkingHoursInput.module.css'
    ),
  ]);

  assert.match(editor, /<PictureCard[\s\S]*?error=\{errors\.imageUrl\}/);
  assert.doesNotMatch(editor, /className=\{css\.pictureError\}/);
  assert.match(pictureCard, /<p className=\{css\.error\} role="alert">/);
  assert.match(pictureCard, /<CircleAlert size=\{16\}/);

  for (const contract of [
    'display: inline-flex',
    'background: var(--color-error-soft',
    'border: 1px solid var(--color-error)',
    'border-radius: var(--radius-md)',
  ]) {
    assert.ok(styles.includes(contract), `PictureCard: ${contract}`);
    assert.ok(hours.includes(contract), `Working hours: ${contract}`);
  }
});
