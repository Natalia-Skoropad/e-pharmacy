import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

//===================================================================

test('owner documents reuse the shared DocumentsPanel without duplicating document presentation', () => {
  const source = read(
    'src/components/profile/OwnerDocumentsPanel/OwnerDocumentsPanel.tsx'
  );

  assert.match(
    source,
    /DocumentsPanel[\s\S]*?ProfileResourceState[\s\S]*?from '@e-pharmacy\/ui\/profile'/
  );

  assert.match(source, /<DocumentsPanel/);
  assert.match(source, /editable=\{false\}/);
  assert.match(source, /readOnlyUploadView=\{status === 'success'\}/);
  assert.match(source, /required/);
  assert.match(source, /onDownloadFile=\{handleDownload\}/);
  assert.match(source, /ProfileResourceState/);
  assert.doesNotMatch(source, /onUploadFiles|onReplaceFile|onDeleteFile/);
  assert.doesNotMatch(source, /<ul[^>]*aria-label="Documents"/);
  assert.doesNotMatch(source, /documentActions|documentItem|documentsList/);
});

//===================================================================

test('personal profile exposes only owner documents, never pharmacy documents', () => {
  const source = read(
    'src/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  );

  assert.match(source, /<OwnerDocumentsPanel \/>/);

  assert.doesNotMatch(
    source,
    /Pharmacy documents|pharmacy\.membershipRole|pharmacyDocuments/
  );
});

//===================================================================

test('owner document BFF routes remain private and do not expose API origin to the browser', () => {
  const collectionRoute = read(
    'src/app/api/pharmacy-owners/me/documents/route.ts'
  );

  const itemRoute = read(
    'src/app/api/pharmacy-owners/me/documents/[documentId]/route.ts'
  );

  assert.match(collectionRoute, /createPrivateProxyRoute/);
  assert.match(collectionRoute, /bodyPreset:\s*'documentUpload'/);
  assert.match(itemRoute, /createPrivateDownloadProxyRoute/);
  assert.match(itemRoute, /createPrivateProxyRoute/);
  assert.match(itemRoute, /method:\s*'DELETE'/);
  assert.match(itemRoute, /method:\s*'PUT'/);
  assert.doesNotMatch(collectionRoute + itemRoute, /NEXT_PUBLIC_API_URL/);
});
