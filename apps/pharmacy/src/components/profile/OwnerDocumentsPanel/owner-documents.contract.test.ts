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
    /import \{ DocumentsPanel \} from '@e-pharmacy\/ui\/profile'/
  );

  assert.match(source, /<DocumentsPanel/);
  assert.doesNotMatch(source, /<ul[^>]*aria-label="Documents"/);
  assert.doesNotMatch(source, /documentActions|documentItem|documentsList/);
});

//===================================================================

test('pharmacy profile keeps registration documents and adds owner documents only for the owner membership', () => {
  const source = read(
    'src/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  );

  assert.match(source, /title="Registration documents"/);
  assert.match(source, /<OwnerDocumentsPanel \/>/);
  assert.match(source, /pharmacy\.membershipRole === 'owner'/);
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
  assert.doesNotMatch(collectionRoute + itemRoute, /NEXT_PUBLIC_API_URL/);
});
