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

  assert.match(list, /productId: requestId[\s\S]*?linkedProductId \?\? ''/);
  assert.match(list, /requestId:[\s\S]*?productId !== filters\.productId/);

  assert.match(scopedProductSearch, /linkedOnly: true/);
  assert.match(scopedProductSearch, /if \(!request\.productId\) continue/);
  assert.match(scopedProductSearch, /getPharmacyProductRequests/);
  assert.doesNotMatch(scopedProductSearch, /getOwnerCatalogProducts/);
  assert.match(scopedProductSearch, /key=\{scopeKey\}/);

  const paths = await read('src/lib/product-requests/product-request-paths.ts');

  assert.match(paths, /request-product-id-/);
  assert.match(paths, /filters\.requestId = id\.toLowerCase\(\)/);
  assert.match(paths, /!filters\.productId\.startsWith\('request-'\)/);
  assert.doesNotMatch(paths, /segments\.push\(`request-product-id-/);
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

//===================================================================

test('request characteristics editor matches the six-field shared catalog contract', async () => {
  const [editor, publicPanel, pharmacyPanel, sharedRows] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      '../client/src/components/product-catalog/ProductDetailsPageContent/ProductCharacteristicsPanel.tsx'
    ),

    read(
      'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
    ),

    read(
      '../../packages/ui/src/data-display/ProductCharacteristicsList/ProductCharacteristicsList.tsx'
    ),
  ]);
  for (const label of [
    'Brand',
    'Series / Line',
    'Manufacturer',
    'Release form',
    'Active ingredients',
    'Active ingredient count',
  ]) {
    assert.ok(editor.includes(`label="${label}"`), label);
    assert.ok(sharedRows.includes(`label: '${label}'`), label);
  }

  assert.match(publicPanel, /<ProductCharacteristicsList product=\{product\}/);

  assert.match(
    pharmacyPanel,
    /<ProductCharacteristicsList product=\{product\}/
  );

  assert.doesNotMatch(sharedRows, /label:\s*'Category'/);
});

//===================================================================

test('product request editor keeps tabs inside one card and photo/category layouts stable', async () => {
  const [editor, styles] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.module.css'
    ),
  ]);

  assert.match(editor, /<section\s+className=\{css\.editorCard\}[\s\S]*?<Tabs/);

  assert.match(
    editor,
    /className=\{css\.editorPanel\}\s+aria-labelledby="details-title"/
  );

  assert.match(
    editor,
    /<PharmacyPhotoPlaceholder[\s\S]*?icon=\{PackageSearch\}/
  );

  assert.match(
    editor,
    /<img\s+src=\{displayedImageSrc\}\s+alt="Selected product preview"/
  );

  assert.match(editor, /label="Product image"[\s\S]*?required/);
  assert.doesNotMatch(editor, /label="Product image \*"/);
  assert.match(editor, /css\.categoryFieldsGrid/);

  assert.equal(
    (editor.match(/className=\{css\.categoryField\}/g) ?? []).length,
    2
  );

  assert.match(styles, /\.imagePreview\s*\{[\s\S]*?height: 320px;/);
  assert.match(styles, /\.imagePreview img\s*\{[\s\S]*?object-fit: cover;/);

  assert.match(
    styles,
    /\.categoryFieldsGrid > \.categoryField\s*\{[\s\S]*?subgrid/
  );
});

//===================================================================

test('request help explains the draft-first workflow and tablet overflow keeps Documents in More', async () => {
  const [editor, tabs] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read('../../packages/ui/src/navigation/Tabs/Tabs.tsx'),
  ]);

  assert.match(editor, /'Creating your product request'/);
  assert.match(editor, /'Editing your product request'/);
  assert.match(editor, /title: 'Save draft',[\s\S]*?icon: <Save/);

  assert.match(
    editor,
    /title: 'Complete product details',[\s\S]*?icon: <CheckCircle2/
  );

  assert.match(editor, /title: 'Send for moderation',[\s\S]*?icon: <Send/);
  assert.match(editor, /Save the draft first, then send the completed request/);
  assert.match(editor, /escapeOverflow[\s\S]*?preferTopLayer/);
  assert.doesNotMatch(editor, /title="Save or send the request"/);

  const editorTabStart = editor.indexOf('const editorTabs = ');
  const editorTabEnd = editor.indexOf('useEffect(', editorTabStart);
  const editorTabSection = editor.slice(editorTabStart, editorTabEnd);

  for (const label of [
    'Details',
    'Characteristics',
    'Full description',
    'Note for Admin',
    'Documents',
  ]) {
    assert.match(editorTabSection, new RegExp(`label: '${label}'`));
  }

  assert.match(
    editor,
    /ariaLabel="Product request editor sections"[\s\S]*?tabletVisibleCount=\{4\}/
  );

  assert.match(tabs, /items\.slice\(normalizedTabletVisibleCount\)/);
  assert.match(tabs, /css\.tabletMoreWrap/);
});

//===================================================================

test('characteristics hide missing values and follow stacked public bank detail rows on mobile', async () => {
  const [sharedRows, sharedStyles, editor] = await Promise.all([
    read(
      '../../packages/ui/src/data-display/ProductCharacteristicsList/ProductCharacteristicsList.tsx'
    ),

    read(
      '../../packages/ui/src/data-display/ProductCharacteristicsList/ProductCharacteristicsList.module.css'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),
  ]);

  assert.match(sharedRows, /rows\.filter\(/);
  assert.match(sharedRows, /value\.trim\(\)\.length > 0/);
  assert.doesNotMatch(sharedRows, /'—'/);
  assert.match(sharedStyles, /min-width: 768px/);
  assert.match(sharedStyles, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(sharedStyles, /text-align: left/);

  for (const field of [
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
  ]) {
    assert.match(editor, new RegExp(`name="${field}"\\s+required=\\{false\\}`));
  }

  const formProjectionStart = editor.indexOf('function toFormState(');

  const formProjectionEnd = editor.indexOf(
    '//===================================================================',
    formProjectionStart + 10
  );

  const formProjection = editor.slice(formProjectionStart, formProjectionEnd);

  assert.match(formProjection, /releaseForm: request\.releaseForm \?\? ''/);
  assert.doesNotMatch(formProjection, /request\.form\b/);
  assert.match(editor, /Boolean\(articleFormatError\)/);
  assert.match(editor, /normalizeProductRequestLatinInput/);
});
