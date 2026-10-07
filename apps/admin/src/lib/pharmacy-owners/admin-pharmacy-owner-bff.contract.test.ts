import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('owner BFF routes keep parity with canonical backend resource builders', async () => {
  const routes = await Promise.all([
    read('../../app/api/admin/pharmacy-owners/route.ts'),
    read('../../app/api/admin/pharmacy-owners/summary/route.ts'),
    read('../../app/api/admin/pharmacy-owners/options/route.ts'),
    read('../../app/api/admin/pharmacy-owners/[ownerId]/route.ts'),
    read('../../app/api/admin/pharmacy-owners/[ownerId]/status/route.ts'),
    read('../../app/api/admin/pharmacy-owners/[ownerId]/pharmacies/route.ts'),
    read('../../app/api/admin/pharmacy-owners/[ownerId]/documents/route.ts'),
    read('../../app/api/admin/pharmacy-owners/[ownerId]/comments/route.ts'),

    read(
      '../../app/api/admin/pharmacy-owners/[ownerId]/comments/[commentId]/route.ts'
    ),

    read('../../app/api/admin/pharmacy-owners/[ownerId]/activity/route.ts'),
  ]);

  const source = routes.join('\n');

  for (const member of [
    'list',
    'summary',
    'options',
    'details',
    'status',
    'pharmacies',
    'documents',
    'comments',
    'comment',
    'activity',
  ]) {
    assert.match(
      source,
      new RegExp(`API_ROUTES\\.admin\\.pharmacyOwners\\.${member}\\b`)
    );
  }

  assert.match(source, /export const PATCH/);
  assert.match(source, /export const POST/);
  assert.match(source, /export const DELETE/);
  assert.doesNotMatch(source, /fetch\(|NextResponse|NEXT_PUBLIC_API/);
});

//===================================================================

test('owner document download stays on the binary-safe private proxy', async () => {
  const route = await read(
    '../../app/api/admin/pharmacy-owners/[ownerId]/documents/[documentId]/route.ts'
  );

  assert.match(route, /createPrivateDownloadProxyRoute/);

  assert.match(
    route,
    /API_ROUTES\.admin\.pharmacyOwners\.document\(ownerId, documentId\)/
  );

  assert.doesNotMatch(route, /createPrivateProxyRoute/);
});

//===================================================================

test('owner browser API stays same-origin, validates ids and treats downloads as blobs', async () => {
  const source = await read('../api/browser/admin-pharmacy-owners.api.ts');

  assert.match(source, /localApiRequest/);
  assert.match(source, /assertAdminPharmacyOwnerEntityId/);

  assert.match(
    source,
    /downloadAdminPharmacyOwnerDocument[\s\S]*?nestedId\(rawDocumentId, 'document id'\)[\s\S]*?responseType: 'blob'/
  );

  assert.match(
    source,
    /deleteAdminPharmacyOwnerComment[\s\S]*?nestedId\(rawCommentId, 'comment id'\)[\s\S]*?responseType: 'no-content'/
  );

  assert.doesNotMatch(source, /fetch\(|NEXT_PUBLIC_API|process\.env/);
});
