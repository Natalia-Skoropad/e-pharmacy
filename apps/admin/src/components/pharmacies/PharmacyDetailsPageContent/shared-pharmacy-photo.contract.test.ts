import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../..'
);

const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

//===================================================================

test('shared identifier cards render published pharmacy photos with initials fallback', () => {
  const card = read(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/SharedPharmacyIdentifiersNotice.tsx'
  );

  assert.match(card, /TableImagePreview/);
  assert.match(card, /src=\{pharmacy\.imageUrl\}/);
  assert.match(card, /fallback=\{initials\(pharmacy\.name\)\}/);
  assert.doesNotMatch(card, /<span>\{initials\(pharmacy\.name\)\}<\/span>/);
});

//===================================================================

test('photo URLs remain lazy, private and permission-gated instead of embedding base64 in JSON', () => {
  const backend = read(
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
  );

  const routes = read('apps/api/src/routes/admin/admin.routes.ts');

  const bff = read(
    'apps/admin/src/app/api/admin/pharmacies/[pharmacyId]/photo/route.ts'
  );

  const contracts = read(
    'packages/api-client/src/contracts/backend-resource-routes.ts'
  );

  assert.match(backend, /'\/api\/admin\/pharmacies\/'/);
  assert.match(backend, /\$regexMatch/);
  assert.match(backend, /imageUrl: other\.imageUrl/);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/photo-source',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(bff, /createPrivateDownloadProxyRoute/);
  assert.match(contracts, /photoSource: \(pharmacyId: EntityId\)/);
});
