import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), 'src', file), 'utf8');

//===============================================================

test('pharmacy document downloads are scoped to a named pharmacy and authenticated', () => {
  const route = read('routes/pharmacy.routes.ts');
  const service = read('services/pharmacy-document.service.ts');
  const controller = read('controllers/pharmacy.controller.ts');

  assert.match(
    route,
    /'\/me\/pharmacies\/:pharmacyId\/documents\/:documentId'[\s\S]*?authenticate[\s\S]*?authorizeRoles\(USER_ROLES\.PHARMACY\)[\s\S]*?ownedPharmacyDocumentParamsSchema[\s\S]*?downloadOwnedPharmacyDocument/
  );

  assert.match(
    controller,
    /getPrivatePharmacyDocumentContentService\([\s\S]*?documentId,\s*pharmacyId/
  );

  assert.match(
    service,
    /findPharmacyForProfileAccess\(\s*userId,\s*'manage_documents',\s*undefined,\s*pharmacyId/
  );

  assert.match(service, /_id: documentId,\s*pharmacyId: pharmacy\._id/);
});
