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

//===================================================================

test('owner-wide request list uses canonical ID/category/status/pagination segments', async () => {
  const paths = await read('src/lib/product-requests/product-request-paths.ts');

  const list = await read(
    'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
  );

  const requestSearch = await read(
    'src/components/product-requests/OwnerProductRequestSearch.tsx'
  );

  for (const segment of [
    'request-id-',
    'product-id-',
    'request-product-id-',
    'category-',
    'status-',
    'page-',
    'per-page-',
  ]) {
    assert.ok(paths.includes(segment), `missing URL filter: ${segment}`);
  }

  assert.match(paths, /parseProductRequestsPaginationSegments/);
  assert.match(list, /OwnerProductRequestSearch/);
  assert.match(list, /OwnerRequestedProductSearch/);
  assert.match(list, /StatsLoadingSkeleton/);
  assert.match(requestSearch, /getPharmacyProductRequests/);

  assert.doesNotMatch(
    list,
    /CurrentPharmacySelector|useSelectedPharmacy|Current pharmacy/
  );

  assert.doesNotMatch(paths, /pharmacyId/);
});

//===================================================================

test('request and product searches share owner-scoped choices without global catalog leakage', async () => {
  const [list, requestSearch, scopedProductSearch] = await Promise.all([
    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),

    read('src/components/product-requests/OwnerProductRequestSearch.tsx'),
    read('src/components/product-requests/OwnerRequestedProductSearch.tsx'),
  ]);

  assert.match(requestSearch, /label: request\.productName/);
  assert.doesNotMatch(requestSearch, /label: `\$\{request\.requestNumber\}/);
  assert.match(list, /relatedRequestFilters/);
  assert.match(list, /relatedProductFilters/);

  assert.match(
    list,
    /productId: requestId \? \(linkedProductId \?\? `request-\$\{requestId\}`\)/
  );

  assert.match(list, /requestId: productId !== filters\.productId \? ''/);

  assert.match(
    scopedProductSearch,
    /request\.productId \?\? `request-\$\{request\.id\}`/
  );

  assert.match(scopedProductSearch, /unlinkedRequestId/);
  assert.match(scopedProductSearch, /getPharmacyProductRequests/);
  assert.doesNotMatch(scopedProductSearch, /getOwnerCatalogProducts/);
  assert.match(scopedProductSearch, /key=\{scopeKey\}/);

  const paths = await read('src/lib/product-requests/product-request-paths.ts');

  assert.match(paths, /request-product-id-/);

  assert.match(
    paths,
    /filters\.productId = `request-\$\{id\.toLowerCase\(\)\}`/
  );

  assert.match(
    paths,
    /segments\.push\(`request-product-id-\$\{filters\.productId\.slice/
  );
});

//===================================================================

test('request category icons follow chosen category mode and new request has no Comments tab', async () => {
  const [table, details] = await Promise.all([
    read(
      'src/components/product-requests/ProductRequestsTable/ProductRequestsTable.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),
  ]);

  assert.match(
    table,
    /const isCustomCategory = request\.categoryMode === 'custom'/
  );

  assert.match(table, /isCustomCategory[\s\S]*?<Settings/);
  assert.match(table, /<CategoryIcon name=\{resolved\?\.icon\}/);
  assert.doesNotMatch(table, /Boolean\(request\.productId && resolved\)/);

  assert.match(
    details,
    /if \(requestId\) \{[\s\S]{0,110}items\.push\(\{ value: 'comments', label: 'Comments' \}\)/
  );

  assert.match(details, /label: 'Change history'/);
  assert.doesNotMatch(details, /label: `Comments \(/);
  assert.doesNotMatch(details, /label: `Change history \(/);
});
