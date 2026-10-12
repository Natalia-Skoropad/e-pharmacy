import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

const routes = [
  ['../../app/api/admin/pharmacies/route.ts', 'pharmacyRegistry.list', 'GET'],
  [
    '../../app/api/admin/pharmacies/summary/route.ts',
    'pharmacyRegistry.summary',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/options/route.ts',
    'pharmacyRegistry.options',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/route.ts',
    'pharmacyDetail.details',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/documents/route.ts',
    'pharmacyDocuments.list',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/comments/route.ts',
    'pharmacyComments.list',
    'POST',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/comments/[commentId]/route.ts',
    'pharmacyComments.detail',
    'DELETE',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/activity/route.ts',
    'pharmacyActivity.list',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/activity/actors/route.ts',
    'pharmacyActivity.actors',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/activity/[auditLogId]/route.ts',
    'pharmacyActivity.details',
    'GET',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/moderation-decisions/route.ts',
    'pharmacyDetail.decision',
    'POST',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/status/route.ts',
    'pharmacyDetail.status',
    'PATCH',
  ],
  [
    '../../app/api/admin/pharmacies/[pharmacyId]/review/corrections/route.ts',
    'pharmacyDetail.corrections',
    'POST',
  ],
] as const;

//===================================================================

test('BFF routes use a private proxy and canonical backend builders', async () => {
  for (const [file, resource, verb] of routes) {
    const source = await read(file);

    assert.match(source, /createPrivateProxyRoute/);
    assert.ok(source.includes(`API_ROUTES.admin.${resource}`), file);
    assert.ok(source.includes(`export const ${verb}`), file);
    assert.doesNotMatch(source, /\bfetch\(|NEXT_PUBLIC_API|process\.env/);
  }

  const binary = await read(
    '../../app/api/admin/pharmacies/[pharmacyId]/documents/[documentId]/route.ts'
  );

  assert.match(binary, /createPrivateDownloadProxyRoute/);
  assert.doesNotMatch(binary, /createPrivateProxyRoute/);
});

//===================================================================

test('permission denial is enforced by backend for every pharmacy resource', async () => {
  const backendRoutes = await read(
    '../../../../api/src/routes/admin.routes.ts'
  );

  for (const verb of ['get', 'post', 'patch', 'delete']) {
    assert.ok(backendRoutes.includes(`adminRoutes.${verb}(`));
  }

  // 403 happens before controller validation / mutations for these routes.
  for (const [path, permission] of [
    ['/pharmacies', 'pharmacies.view'],
    ['/pharmacies/:pharmacyId', 'pharmacies.view'],
    ['/pharmacies/:pharmacyId/documents', 'pharmacies.view'],
    ['/pharmacies/:pharmacyId/comments', 'pharmacies.edit'],
    ['/pharmacies/:pharmacyId/moderation-decisions', 'pharmacies.moderate'],
    ['/pharmacies/:pharmacyId/status', 'pharmacies.moderate'],
    ['/pharmacies/:pharmacyId/review/corrections', 'pharmacies.moderate'],
  ] as const) {
    assert.ok(backendRoutes.includes(`'${path}'`), path);

    assert.ok(
      backendRoutes.includes(`ADMIN_PERMISSIONS.${permission}`),
      permission
    );
  }

  const browser = await read('../api/browser/admin-pharmacy-detail.api.ts');

  assert.match(browser, /localApiRequest/);
  assert.match(browser, /signal: options\?\.signal/);
  assert.match(browser, /clientRequestId/);
  assert.match(browser, /responseType: 'blob'/);
  assert.doesNotMatch(browser, /\bfetch\(|NEXT_PUBLIC_API|process\.env/);
});

//===================================================================

test('the proxy forwards a distinct request ID and body idempotency key to backend', async () => {
  const proxy = await read(
    '../../../../../packages/next-api/src/proxy/route-factories.ts'
  );

  const backendFetch = await read(
    '../../../../../packages/next-api/src/internal/backend-fetch.ts'
  );

  const headers = await read(
    '../../../../../packages/next-api/src/internal/request-headers.ts'
  );

  assert.match(proxy, /requestId = createRequestId\(\)/);
  assert.match(backendFetch, /requestId,/);
  assert.match(headers, /headers\.set\(REQUEST_ID_HEADER_NAME, requestId\)/);

  const body = await read('../../../../api/src/schemas/admin.schema.ts');

  assert.match(body, /clientRequestId: pharmacyModerationMutationKey/g);
});
