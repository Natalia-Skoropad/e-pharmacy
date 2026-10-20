import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (relative: string) =>
  readFileSync(resolve(process.cwd(), relative), 'utf8');

//===============================================================

test('14.18.3 migration requires registration provenance and preserves original source', () => {
  const source = read(
    'src/services/pharmacy-owner-documents-migration.service.ts'
  );

  assert.match(source, /registrationUploadSessionId/);

  assert.match(
    source,
    /String\(pharmacy.ownerId\) !== String\(file.uploadedByUserId\)/
  );

  assert.match(source, /reference.sha256 !== file.sha256/);
  assert.match(source, /decodeAndVerifyDocumentUpload/);

  assert.match(
    source,
    /matchesOriginal\(destination, file, pharmacy.ownerId\)/
  );

  assert.doesNotMatch(
    source,
    /PharmacyDocumentFile\.(?:deleteMany|deleteOne|findOneAndDelete)/
  );

  assert.match(source, /if \(!apply\) \{/);
});

//===============================================================

test('14.18.3 verification requires independent owner documents', () => {
  const source = read('src/services/pharmacy.service.ts');

  assert.match(
    source,
    /PharmacyOwnerDocument.exists\(\{\s*ownerUserId: pharmacy.ownerId/
  );

  assert.match(source, /missingFields: \['ownerDocuments'\]/);
});

//===============================================================

test('14.18.3 owner documents support atomic replace and guard the last file', () => {
  const service = read('src/services/pharmacy-owner-document.service.ts');
  const route = read('src/routes/pharmacy-owner.routes.ts');

  assert.match(service, /replacePharmacyOwnerDocumentService/);
  assert.match(service, /session.withTransaction/);
  assert.match(service, /documents.length <= 1/);
  assert.match(service, /PHARMACY_OWNER_DOCUMENT_REPLACED/);
  assert.match(route, /pharmacyOwnerRoutes.put\(/);
  assert.match(route, /pharmacyOwnerDocumentUploadSchema/);
});
