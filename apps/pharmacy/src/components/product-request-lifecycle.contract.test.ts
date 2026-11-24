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
  assert.match(modeSource, /requestStatus === 'new'/);
  assert.match(modeSource, /reviewState === 'changes_requested'/);
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
    'category-',
    'status-',
    'page-',
    'per-page-',
  ]) {
    assert.ok(paths.includes(segment), `missing URL filter: ${segment}`);
  }

  assert.match(paths, /parseProductRequestsPaginationSegments/);
  assert.match(list, /OwnerProductRequestSearch/);
  assert.doesNotMatch(list, /OwnerRequestedProductSearch/);
  assert.match(list, /StatsLoadingSkeleton/);
  assert.match(requestSearch, /getPharmacyProductRequests/);

  assert.doesNotMatch(
    list,
    /CurrentPharmacySelector|useSelectedPharmacy|Current pharmacy/
  );

  assert.doesNotMatch(paths, /pharmacyId/);
});

//===================================================================

test('request search is owner-scoped and discontinued product URLs are not emitted', async () => {
  const [list, requestSearch, paths] = await Promise.all([
    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),

    read('src/components/product-requests/OwnerProductRequestSearch.tsx'),
    read('src/lib/product-requests/product-request-paths.ts'),
  ]);

  assert.match(requestSearch, /label: request\.productName/);
  assert.match(list, /relatedRequestFilters/);
  assert.match(list, /OwnerProductRequestSearch/);

  assert.doesNotMatch(
    list,
    /OwnerRequestedProductSearch|relatedProductFilters/
  );

  assert.doesNotMatch(list, /filters\.productId/);
  assert.doesNotMatch(paths, /segment\.startsWith\('product-id-'/);
  assert.doesNotMatch(paths, /segment\.startsWith\('request-product-id-'/);
  assert.doesNotMatch(paths, /segments\.push\(`product-id-/);
});

//===================================================================

test('two-segment request filters take precedence over entity tabs and preserve Back history', async () => {
  const [route, list] = await Promise.all([
    read('src/app/pharmacy/product-requests/[requestId]/[tab]/page.tsx'),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  assert.match(route, /isProductRequestsFilterRoute\(segments\)/);
  assert.match(route, /parseProductRequestsSegments\(params\)/);
  assert.match(route, /parseProductRequestsPaginationSegments\(params\)/);
  assert.match(route, /<ProductRequestsPageContent/);
  assert.match(list, /router\.push\(nextPath, \{ scroll: false \}\)/);
  assert.doesNotMatch(list, /router\.replace\(nextPath/);
});

//===================================================================

test('editor guards unsaved draft navigation and uses shared detail tabs', async () => {
  const [editor, guard, panels] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/useUnsavedProductRequestNavigation.ts'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),
  ]);

  assert.match(editor, /Leave product request editor\?/);

  assert.match(
    editor,
    /getProductRequestEditorSignature\(PRODUCT_REQUEST_INITIAL_VALUES, \[\], \[\]\)/
  );

  assert.match(editor, /if \(url && isDirty\)/);
  assert.match(guard, /window\.addEventListener\('beforeunload'/);
  assert.match(guard, /window\.addEventListener\('popstate'/);
  assert.match(guard, /document\.addEventListener\('click'/);
  assert.match(editor, /<ProductRequestDetailSections/);
  assert.match(panels, /label=\"Files and documents\"[\s\S]*?required/);
});

//===================================================================

test('request category icons follow chosen category mode and new request has no Comments tab', async () => {
  const [table, details, category] = await Promise.all([
    read(
      'src/components/product-requests/ProductRequestsTable/ProductRequestsTable.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read('src/components/product-requests/ProductRequestCategory.tsx'),
  ]);

  assert.match(table, /<ProductRequestCategory/);
  assert.match(category, /if \(!name\) return <span>—<\/span>/);

  assert.match(
    category,
    /const isCustomCategory = request\.categoryMode === 'custom'/
  );

  assert.match(category, /isCustomCategory[\s\S]*?<Settings/);
  assert.match(category, /<CategoryIcon name=\{resolved\?\.icon\}/);
  assert.doesNotMatch(category, /Boolean\(request\.productId && resolved\)/);
  assert.match(details, /\.\.\.\(requestId\s*\?\s*\[[\s\S]*label: 'Comments'/);
  assert.match(details, /label: 'Activity history'/);
  assert.doesNotMatch(details, /label: `Comments \(/);
  assert.doesNotMatch(details, /label: `Activity history \(/);
});

//===================================================================

test('request characteristics editor matches the six-field shared catalog contract', async () => {
  const [editor, publicPanel, pharmacyPanel, sharedRows] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
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

test('product request editor keeps all tabs in one card and field panels responsive', async () => {
  const [editor, panel, panelStyles] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.module.css'
    ),
  ]);

  assert.match(
    editor,
    /<section className=\{css\.editorCard\}[^>]*>[\s\S]*?<Tabs/
  );

  assert.match(editor, /<ProductRequestEditorPanels/);
  assert.match(editor, /<ProductRequestDetailSections/);

  assert.match(
    panel,
    /className=\{css\.editorPanel\}[\s\S]*?aria-labelledby="product-data-title"/
  );

  assert.match(
    panel,
    /<PharmacyPhotoPlaceholder[\s\S]*?icon=\{PackageSearch\}/
  );

  assert.match(panel, /<img[\s\S]*?src=\{displayedImageSrc\}/);
  assert.match(panel, /label="Product image"[\s\S]*?required/);

  assert.equal(
    (panel.match(/className=\{css\.categoryField\}/g) ?? []).length,
    2
  );

  assert.match(panelStyles, /\.imagePreview\s*\{[\s\S]*?height: 320px;/);

  assert.match(
    panelStyles,
    /\.categoryFieldsGrid > \.categoryField[\s\S]*?subgrid/
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
    'Product data',
    'Characteristics',
    'About product',
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

test('request editor uses shared About product and document upload controls', async () => {
  const [source, panel, styles] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.module.css'
    ),
  ]);

  assert.match(source, /label: 'About product',[\s\S]*?icon: <FileText/);
  assert.match(source, /label: 'Note for Admin',[\s\S]*?icon: <StickyNote/);
  assert.match(source, /label: 'Documents',[\s\S]*?icon: <Files/);

  assert.match(
    panel,
    /name="fullDescription"[\s\S]*?expanded|expanded[\s\S]*?name="fullDescription"/
  );

  assert.match(panel, /At least 100 characters when filled/);
  assert.match(panel, /title="Note for Admin"[\s\S]*?icon=\{<StickyNote/);
  assert.match(panel, /className=\{css\.noteField\}/);
  assert.match(styles, /\.noteField textarea/);
  assert.match(panel, /title="Documents"[\s\S]*?icon=\{<Files/);
  assert.match(panel, /label="Files and documents"[\s\S]*?required/);
  assert.match(panel, /PDF, DOC, DOCX, JPG, PNG or WEBP/);
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
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
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

  const host = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
  );

  const formProjectionStart = host.indexOf('function toFormState(');

  const formProjectionEnd = host.indexOf(
    '//===================================================================',
    formProjectionStart + 10
  );

  const formProjection = host.slice(formProjectionStart, formProjectionEnd);

  assert.match(formProjection, /releaseForm: request\.releaseForm \?\? ''/);
  assert.doesNotMatch(formProjection, /request\.form\b/);
  assert.match(editor, /Boolean\(articleFormatError\)/);
  assert.match(editor, /normalizeProductRequestLatinInput/);
});

//===================================================================

test('supporting documents upload individually before the draft JSON mutation', async () => {
  const source = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
  );

  const browserApi = await read('src/lib/api/browser/product-requests.api.ts');

  assert.match(source, /uploadPharmacyProductRequestDocument\(/);
  assert.match(source, /documentId: uploaded\.document\.documentId/);

  const panel = await read(
    'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
  );

  assert.match(panel, /onDownloadFile=\{async \(file\)/);

  assert.match(
    browserApi,
    /localApiRequest\(path, \{ method: 'POST', body: payload \}\)/
  );
});

//===================================================================

test('existing request save actions belong to editable tabs and long names do not expand the list', async () => {
  const [editor, panel, table, styles, topbar] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsTable/ProductRequestsTable.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsTable/ProductRequestsTable.module.css'
    ),

    read('src/components/layout/PharmacyHeader/PharmacyHeader.module.css'),
  ]);

  assert.match(editor, /!requestId \? saveAction : null/);
  assert.match(editor, /saveAction=\{requestId \? saveAction : undefined\}/);
  assert.equal((panel.match(/action=\{saveAction\}/g) ?? []).length, 5);
  assert.doesNotMatch(editor, /Last updated/);
  assert.match(editor, /confirmIconLeft=\{<LogOut/);
  assert.match(editor, /cancelIconLeft=\{<X/);
  assert.match(table, /key: 'productName',[\s\S]*?css\.breakableLink/);
  assert.match(styles, /\.breakableLink\s*\{[^}]*overflow-wrap: anywhere/);
  assert.match(topbar, /li:first-child\s*\{[^}]*flex: 1\.5 1 0/);
  assert.match(topbar, /li:last-child\s*\{[^}]*flex: 1 1 0/);
  assert.match(topbar, /text-overflow: ellipsis/);
  assert.match(styles, /\.requestTable \.breakableLink\s*\{[^}]*width: auto/);
  assert.match(table, /className=\{css\.requestTable\}/);

  assert.match(
    editor,
    /const displayedImageSrc: string \| null[\s\S]*?savedImageSrc \?\? null/
  );

  const headerStyles = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.module.css'
  );

  assert.match(
    headerStyles,
    /\.contentCard > \.requestPageHeader\s*\{[^}]*display: grid/
  );

  assert.match(
    headerStyles,
    /grid-template-columns: minmax\(0, 1fr\) fit-content\(55%\)/
  );
});

//===================================================================

test('request overview is route-owned, read-only and links only approved requests to the catalog', async () => {
  const [editor, panel, overview, route, category, css] = await Promise.all([
    read(
      'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
    ),

    read(
      'src/components/product-requests/NewProductRequestPageContent/ProductRequestEditorPanels.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestDetailsPageContent/ProductRequestOverview.tsx'
    ),

    read('src/app/pharmacy/product-requests/[requestId]/[tab]/page.tsx'),
    read('src/components/product-requests/ProductRequestCategory.tsx'),

    read(
      'src/components/product-requests/ProductRequestDetailsPageContent/ProductRequestOverview.module.css'
    ),
  ]);

  assert.match(editor, /initialTab = requestId \? 'details' : 'product-data'/);

  assert.match(
    editor,
    /const activeEditorTab = requestId \? initialTab : newRequestTab/
  );

  assert.match(editor, /\.\.\.\(requestId[\s\S]*?value: 'details' as const/);

  assert.match(
    editor,
    /tab === 'details'\s*\? getPharmacyRequestPath\(requestId\)/
  );

  assert.match(
    editor,
    /activeEditorTab === 'details' && request \? \(\s*<ProductRequestOverview request=\{request\}/
  );

  assert.match(editor, /dispatchPharmacyBreadcrumbLabel\(request.name\)/);
  assert.doesNotMatch(editor, /<StatusBadge|requestStatusLine/);

  assert.match(
    panel,
    /activeEditorTab === 'product-data'[\s\S]*?title="Product data"[\s\S]*?icon=\{<Package size=/
  );

  assert.match(route, /'product-data': 'product-data'/);
  assert.match(route, /tab === 'details'\) redirect/);

  assert.match(
    overview,
    /title="Product details"[\s\S]*?icon=\{<PackageSearch/
  );

  assert.match(
    overview,
    /request.status === 'approved' && isValidObjectId\(request.productId\)/
  );

  assert.match(overview, /getPharmacyAllProductPath\(request.productId\)/);
  assert.match(overview, /<LinkButton href=\{productHref\}/);
  assert.match(overview, /<Button[^>]*disabled/);
  assert.match(overview, /<ShimmerImage/);

  assert.match(
    overview,
    /request.productImage\?\.dataUrl \?\? request.productImageUrl/
  );

  assert.match(overview, /<ProductRequestCategory request=\{request\}/);
  assert.match(category, /if \(!name\) return <span>—<\/span>/);

  for (const label of [
    'Status',
    'Category',
    'Article',
    'Request ID',
    'Creation date',
    'Last update date',
  ]) {
    assert.ok(overview.includes(`<dt>${label}</dt>`), label);
  }

  assert.doesNotMatch(
    overview,
    /Save changes|handleSaveDraft|displayedImageSrc/
  );

  assert.match(css, /min-width: 1440px/);
  assert.match(css, /overflow-wrap: anywhere/);
});
