import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('product request flow uses one explicit feature mode contract', async () => {
  const source = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
  );

  const modeSource = await read(
    'src/components/product-requests/NewProductRequestPageContent/product-request-page-mode.ts'
  );

  assert.match(
    modeSource,
    /ProductRequestPageMode = 'new' \| 'clone' \| 'edit' \| 'readonly'/
  );

  assert.match(source, /const requestMode = resolveProductRequestPageMode/);
  assert.match(source, /const isDraft = requestMode === 'edit'/);
  assert.match(source, /const canEdit = requestMode !== 'readonly'/);
  assert.match(source, /requestMode !== 'readonly'/);
});

//===================================================================

test('clone mode accepts rejected sources only and never copies server-managed request state', async () => {
  const source = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
  );

  assert.match(
    source,
    /cloneSourceRequestId && loadedRequest\.status !== 'rejected'/
  );

  assert.match(
    source,
    /Only rejected product requests can be used as a source/
  );

  const formProjectionStart = source.indexOf('function toFormState(');

  const formProjectionEnd = source.indexOf(
    '//===================================================================',
    formProjectionStart + 10
  );

  const formProjection = source.slice(formProjectionStart, formProjectionEnd);

  for (const serverManagedField of ['status', 'history', 'productId', 'id:']) {
    assert.doesNotMatch(formProjection, new RegExp(serverManagedField));
  }
});

//===================================================================

test('request entity generations remount local state and abort async work', async () => {
  const [detailsWrapper, newRoute, source] = await Promise.all([
    read(
      'src/components/product-requests/ProductRequestDetailsPageContent/ProductRequestDetailsPageContent.tsx'
    ),

    read('src/app/pharmacy/product-requests/new/page.tsx'),

    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),
  ]);

  assert.match(
    detailsWrapper,
    /getProductRequestGenerationKey\(\{ requestId \}\)/
  );

  assert.match(newRoute, /getProductRequestGenerationKey\(\{/);
  assert.match(newRoute, /sourceRequestId/);

  assert.match(source, /const controller = new AbortController\(\)/);
  assert.match(source, /controller\.abort\(\)/);
  assert.match(source, /imageReadControllerRef\.current\?\.abort\(\)/);

  assert.match(
    source,
    /additionalFilesReadControllerRef\.current\?\.abort\(\)/
  );
});
