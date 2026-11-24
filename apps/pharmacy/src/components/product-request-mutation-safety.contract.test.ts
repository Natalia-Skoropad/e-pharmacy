import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';

import { uploadProductRequestDocuments } from './product-requests/NewProductRequestPageContent/product-request-document-upload';

//===================================================================

const REQUEST_PATH =
  'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx';

//===================================================================

test('product request mutations wait for every file reader and share one mutation lock', async () => {
  const source = await readFile(resolve(process.cwd(), REQUEST_PATH), 'utf8');

  assert.match(source, /isAdditionalFilesProcessing/);

  assert.match(
    source,
    /isFileProcessing = isImageProcessing \|\| isAdditionalFilesProcessing/
  );

  assert.match(source, /mutationLockRef = useRef\(false\)/);
  assert.match(source, /mutationLockRef\.current = true/);
  assert.match(source, /mutationLockRef\.current = false/);
  assert.match(source, /additionalFilesReadControllerRef\.current/);

  const panels = await readFile(
    resolve(
      process.cwd(),
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),
    'utf8'
  );

  assert.match(
    panels,
    /disabled=\{!canEdit \|\| isMutating \|\| isFileProcessing\}/
  );

  const additionalFilesStart = source.indexOf(
    'const handleAdditionalFilesChange = async'
  );

  const buildPayloadStart = source.indexOf(
    'const buildPayload =',
    additionalFilesStart
  );

  const additionalFilesSource = source.slice(
    additionalFilesStart,
    buildPayloadStart
  );

  assert.match(additionalFilesSource, /uploadProductRequestDocuments\(/);

  const uploader = await readFile(
    resolve(
      process.cwd(),
      'src/components/product-requests/NewProductRequestPageContent/product-request-document-upload.ts'
    ),
    'utf8'
  );

  assert.match(uploader, /for \(const file of files\)/);
  assert.doesNotMatch(uploader, /Promise\.all/);
  assert.doesNotMatch(additionalFilesSource, /Promise\.all/);
});

//===================================================================

test('article checking separates conflict from transport failure without rendering success copy', async () => {
  const source = await readFile(resolve(process.cwd(), REQUEST_PATH), 'utf8');

  assert.match(
    source,
    /'idle' \| 'checking' \| 'available' \| 'conflict' \| 'error'/
  );

  assert.match(
    source,
    /setArticleCheckStatus\(result\.available \? 'available' : 'conflict'\)/
  );

  assert.match(source, /setArticleCheckStatus\('error'\)/);

  assert.match(
    source,
    /articleCheckStatus === 'conflict' \|\| articleCheckStatus === 'error'/
  );

  const panels = await readFile(
    resolve(
      process.cwd(),
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),
    'utf8'
  );

  assert.match(panels, /error=\{errors\.article\}/);
  assert.doesNotMatch(source, /Article is available/);
  assert.doesNotMatch(source, /articleCheckStatus === 'unavailable'/);
});

//===================================================================

test('scoped product and request actions never surface raw Error.message', async () => {
  const paths = [
    'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx',
    'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx',
    'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx',
    REQUEST_PATH,
  ];

  for (const path of paths) {
    const source = await readFile(resolve(process.cwd(), path), 'utf8');

    assert.doesNotMatch(source, /error instanceof Error && error\.message/);
    assert.doesNotMatch(source, /isApiError\(error\) && error\.message/);
  }
});

//===================================================================

function makeDocument(id: string, saved = false): BrowserUploadFile {
  const file = new File(['content'], `${id}.pdf`, { type: 'application/pdf' });

  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    ...(saved ? { documentId: id } : { file }),
  };
}

//===================================================================

function asStored(file: BrowserUploadFile): BrowserUploadFile {
  return {
    id: `stored-${file.id}`,
    documentId: `stored-${file.id}`,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

//===================================================================

test('six selected documents are published individually after each successful upload', async () => {
  const files = Array.from({ length: 6 }, (_, i) => makeDocument(String(i)));
  const snapshots: string[][] = [];

  const result = await uploadProductRequestDocuments(
    files,
    new AbortController().signal,

    async (file) => {
      assert.equal(snapshots.at(-1)?.length, Number(file.id));
      return asStored(file);
    },

    (completed) => snapshots.push(completed.map((file) => file.id))
  );

  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.length),
    [0, 1, 2, 3, 4, 5, 6]
  );

  assert.equal(result?.length, 6);
  assert.ok(result?.every((file) => file.documentId && !file.file));
});

//===================================================================

test('a failed later upload preserves existing and successfully stored documents', async () => {
  const files = [
    makeDocument('existing', true),
    makeDocument('first'),
    makeDocument('second'),
    makeDocument('third'),
  ];

  const snapshots: string[][] = [];

  await assert.rejects(
    uploadProductRequestDocuments(
      files,

      new AbortController().signal,

      async (file) => {
        if (file.id === 'second') throw new Error('failed');
        return asStored(file);
      },

      (completed) => snapshots.push(completed.map((file) => file.id))
    ),
    /failed/
  );

  assert.deepEqual(snapshots, [['existing'], ['existing', 'stored-first']]);
});

//===================================================================

test('aborting a pending upload prevents it and later documents from updating the editor', async () => {
  const controller = new AbortController();
  const snapshots: string[][] = [];
  const calls: string[] = [];

  const result = await uploadProductRequestDocuments(
    [makeDocument('first'), makeDocument('second')],
    controller.signal,

    async (file) => {
      calls.push(file.id);
      controller.abort();
      return asStored(file);
    },

    (completed) => snapshots.push(completed.map((file) => file.id))
  );

  assert.equal(result, null);
  assert.deepEqual(calls, ['first']);
  assert.deepEqual(snapshots, [[]]);
});
