import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

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

  assert.match(
    source,
    /disabled=\{!canEdit \|\| isMutating \|\| isFileProcessing\}/
  );
});

//===================================================================

test('article checking separates conflict from transport failure and announces async state', async () => {
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
  assert.match(source, /aria-live="polite"/);
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
