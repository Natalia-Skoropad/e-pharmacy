import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

//===================================================================

const DETAILS_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.tsx'
);

const DETAILS_STYLES = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.module.css'
);

const ORDERS_SOURCE = path.join(
  CURRENT_DIR,
  'OrderScopeSearch',
  'OrderScopeSearch.tsx'
);

const PRODUCT_SOURCE = path.resolve(
  CURRENT_DIR,
  '../products/OwnProductDetailsPageContent/OwnProductRelatedOrdersTab.tsx'
);

const STOCK_ORDER_SEARCH_SOURCE = path.resolve(
  CURRENT_DIR,
  '../products/OwnProductDetailsPageContent/StockMovementOrderSearch.tsx'
);

const CREATE_CLIENT_SEARCH_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'NewOrderClientSearch.tsx'
);

const PICKER_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'ProductPickerModal.tsx'
);

const TABS_DIR = path.join(CURRENT_DIR, 'OrderDetailsPageContent');

//===================================================================

async function readOrderPresentation(): Promise<string> {
  const files = [
    'OrderDetailsPageContent.tsx',
    'OrderProductsTab.tsx',
    'OrderMethodTabs.tsx',
    'OrderActivityTabs.tsx',
  ];

  return (
    await Promise.all(
      files.map((file) => readFile(path.join(TABS_DIR, file), 'utf8'))
    )
  ).join('\n');
}

//===================================================================

test('client search help documents all supported identifiers', async () => {
  const [ordersSource, productSource, detailsSource, clientSelectSource] =
    await Promise.all([
      readFile(ORDERS_SOURCE, 'utf8'),
      readFile(PRODUCT_SOURCE, 'utf8'),
      readOrderPresentation(),
      readFile(CREATE_CLIENT_SEARCH_SOURCE, 'utf8'),
    ]);

  const normalizeWhitespace = (source: string) => source.replace(/\s+/g, ' ');
  const help = 'Search by client name, ID, email, phone number, or address.';

  assert.match(ordersSource, /isClient \? 'Client search'/);

  assert.ok(
    normalizeWhitespace(ordersSource).includes(
      'Search by client name, ID, email, phone number, or address.'
    )
  );

  // Related orders now reuses the shared OrderScopeSearch for help text.
  assert.match(
    productSource,
    /<OrdersPageContent relatedProductId=\{productId\}/
  );

  assert.ok(normalizeWhitespace(ordersSource).includes(help));
  assert.match(detailsSource, /<NewOrderClientSearch/);
  assert.match(clientSelectSource, /Search fields/);
  assert.match(clientSelectSource, /name, ID, email, phone, or address/);
  assert.match(clientSelectSource, /searchText:/);
  assert.match(clientSelectSource, /perPage: PAGE_SIZE/);
  assert.match(clientSelectSource, /onLoadMore=\{loadMore\}/);

  const stockSearch = await readFile(STOCK_ORDER_SEARCH_SOURCE, 'utf8');

  assert.match(ordersSource, /css\.orderSearchIcon/);
  assert.match(ordersSource, /<ShoppingBag size=\{20\}/);
  assert.match(stockSearch, /icon=\{<ShoppingBag size=\{20\}/);
});

//===================================================================

test('new order uses active client badge, matching states and compact controls', async () => {
  const [detailsSource, styles] = await Promise.all([
    readOrderPresentation(),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.match(detailsSource, /target="_blank"/);
  assert.match(detailsSource, /rel="noopener noreferrer"/);
  assert.match(detailsSource, /Order creation is unavailable/);

  assert.match(
    detailsSource,
    /PHARMACY_STATUS_PRESENTATION\[createLockedStatus\]/
  );

  assert.match(detailsSource, /const pharmacyLockedStatus =/);
  assert.match(detailsSource, /const isEditable = isCreateMode/);

  assert.match(
    detailsSource,
    /order\?\.status === 'in_progress' && !pharmacyLockedStatus/
  );

  assert.match(detailsSource, /Boolean\(pharmacyLockedStatus\)/);
  assert.match(detailsSource, /manager comment mutations are disabled/);
  assert.match(detailsSource, /className=\{css\.loaderBox\}/);
  assert.match(detailsSource, /<StatusBanner[\s\S]{0,180}tone="danger"/);
  assert.match(styles, /\.loaderBox\s*\{/);
  assert.match(styles, /\.methodHeader \.tabSaveButton/);
});

//===================================================================

test('order draft product and checkout presentation matches requested contracts', async () => {
  const [detailsSource, pickerSource, styles] = await Promise.all([
    readOrderPresentation(),
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.doesNotMatch(detailsSource, />\s*ProductDetails details\s*</);
  assert.match(detailsSource, />\s*Details\s*</);
  assert.doesNotMatch(detailsSource, />\s*Add products\s*</);
  assert.match(detailsSource, /Click [‘“]Add more products[’”]/);
  assert.match(detailsSource, /Recipient name/);
  assert.match(detailsSource, /Tax ID \/ EDRPOU/);
  assert.match(detailsSource, /Bank name/);
  assert.match(detailsSource, /<CopyButton/);

  assert.match(
    detailsSource,
    /After payment, the client should send the receipt to the[\s\S]{0,80}pharmacy email for faster processing\./
  );

  assert.match(pickerSource, /className=\{css\.productModalActions\}/);
  assert.match(styles, /\.productModalActions\s*\{/);

  assert.doesNotMatch(
    detailsSource,
    /errorClassName=\{css\.deliveryAddressError\}/
  );

  assert.doesNotMatch(styles, /\.deliveryAddressError\s*\{/);
});

//===================================================================

test('create order only exposes editable tabs and guards saving until the draft is complete', async () => {
  const source = await readOrderPresentation();

  assert.match(source, /getOrderTabs\(isCreateMode: boolean\)/);
  assert.match(source, /if \(!isCreateMode\)/);
  assert.match(source, /const canSaveCreateOrder = Boolean\(/);

  assert.match(
    source,
    /isCreateMode\s*&&\s*isEditable\s*&&\s*order\s*&&\s*selectedClientId/
  );

  assert.match(source, /hasValidationErrors\(deliveryErrors\)/);
  assert.match(source, /disabled=\{!canSaveCreateOrder\}/);
  assert.match(source, /action=\{!isCreateMode \? \(\s*<Button/);

  assert.match(
    source,
    /ProfileSectionHeader[\s\S]*?Choose how the client will receive the order\./
  );

  assert.match(
    source,
    /ProfileSectionHeader[\s\S]*?Choose how the client will pay for the order\./
  );
});

//===================================================================

test('create order renders product category icons, contextual actions and public-style bank details', async () => {
  const [source, picker, styles] = await Promise.all([
    readOrderPresentation(),
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.match(
    source,
    /<CategoryIcon\s+name=\{categoryIcons\[item\.category\.slug\]\}/
  );

  assert.match(source, /destructive[\s\S]*?confirmIconLeft=\{<Trash2/);
  assert.match(source, /className=\{css\.bankCopyAction\}/);
  assert.match(picker, /getProductCategories/);
  assert.match(picker, /<ProfileResourceState/);
  assert.match(picker, /[Nn]ame, article, or product ID/);
  assert.match(picker, /categoryIcons\[product\.category\.slug\]/);
  assert.match(styles, /\.bankList \.bankRow\s*\{/);
});

//===================================================================

test('manager checkout uses server-protected prices and offers stock revision feedback', async () => {
  const [details, picker, css] = await Promise.all([
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.match(details, /expectedUnitPrice: unitPrice/);
  assert.match(details, /ORDER_PRICE_CHANGED_ERROR_CODE/);
  assert.match(details, /STOCK_CHANGED_ERROR_CODE/);
  assert.match(details, /Leave order editor\?/);
  assert.match(details, /eyebrow="CREATE ORDER"/);
  assert.match(picker, /labelAccessory=/);
  assert.match(picker, /order\.items/);
  assert.match(picker, /order\.id === 'draft'/);
  assert.match(picker, /productModalAddSpinner/);
  assert.match(css, /height: min\(760px, calc\(100dvh - 32px\)\)/);
});

//===================================================================

test('stock conflicts use the shared pharmacy-warning modal design and preserve draft actions', async () => {
  const modalSource = path.join(TABS_DIR, 'OrderCreateConflictModal.tsx');

  const modalStyles = path.join(
    TABS_DIR,
    'OrderCreateConflictModal.module.css'
  );

  const [details, modal, styles] = await Promise.all([
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(modalSource, 'utf8'),
    readFile(modalStyles, 'utf8'),
  ]);

  assert.match(details, /<OrderCreateConflictModal/);
  assert.match(details, /setDraftItems\(createConflict\.refreshedItems\)/);
  assert.match(details, /setActiveTab\('products'\)/);
  assert.match(modal, /<ModalBase/);
  assert.match(modal, /<CloseIconButton/);
  assert.match(modal, /Not enough products are available/);
  assert.match(modal, /Product prices have changed/);
  assert.match(modal, /<AlertTriangle/);
  assert.match(modal, /conflict\.details\.map/);
  assert.match(details, /productId: item\.productId/);

  assert.match(
    details,
    /getOrderProductDetails\(\s*item\.productId,\s*order\.pharmacyId/
  );

  assert.match(details, /const checks = await Promise\.all/);
  assert.match(details, /const details = checks\.map/);
  assert.match(details, /refreshedItem: null/);
  assert.match(modal, /Products to review \(\{conflict\.details\.length\}\)/);
  assert.match(modal, /<TableImagePreview/);
  assert.match(modal, /getPharmacyProductPath\(detail\.productId\)/);
  assert.match(modal, /target="_blank"/);
  assert.match(modal, /rel="noopener noreferrer"/);

  assert.match(
    modal,
    /conflict\.refreshedItems \? 'Update order draft' : 'Review order'/
  );

  assert.match(modal, /Keep editing/);
  assert.match(modal, /onClick=\{onCancel\}/);
  assert.match(styles, /\.scrollableDialog\s*\{/);
  assert.match(styles, /max-height: calc\(100dvh - 40px\)/);
  assert.match(styles, /\.notice\s*\{/);
  assert.match(styles, /\.detailsList\s*\{/);
  assert.match(styles, /\.actions\s*\{/);
});

//===================================================================

test('changed order prices require explicit confirmation before increasing, decreasing or removing products', async () => {
  const [details, priceModal, modalStyles] = await Promise.all([
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(path.join(TABS_DIR, 'OrderPriceChangeModal.tsx'), 'utf8'),
    readFile(
      path.join(TABS_DIR, 'OrderCreateConflictModal.module.css'),
      'utf8'
    ),
  ]);

  const quantityHandler = details.match(
    /const handleQuantityChange = \([\s\S]*?const handleRequestRemoveProduct =/
  )?.[0];

  assert.ok(quantityHandler);

  assert.match(
    quantityHandler,
    /if \(quantity < 1\) \{\s*handleRequestRemoveProduct\(item\)/
  );

  assert.match(
    quantityHandler,
    /if \(quantity !== item\.quantity && hasChangedProductPrice\(item\)\) \{\s*setPendingPriceQuantityChange/
  );

  assert.match(quantityHandler, /applyQuantityChange\(item, quantity\)/);
  assert.equal((details.match(/<OrderPriceChangeModal/g) ?? []).length, 2);
  assert.match(details, /action:[\s\S]*?'decrease'[\s\S]*?: 'increase'/);
  assert.match(details, /hasChangedProductPrice\(productToRemove\)/);
  assert.match(details, /action: 'remove'/);
  assert.match(details, /onConfirm=\{handleConfirmRemoveProduct\}/);

  assert.match(
    details,
    /isOpen=\{Boolean\(\s*productToRemove && !hasChangedProductPrice\(productToRemove\)\s*\)\}/
  );

  assert.match(priceModal, /Product price changed/);
  assert.match(priceModal, /Price update/);
  assert.match(priceModal, /Are you sure you want to remove one unit\?/);
  assert.match(priceModal, /entire order line will use the new price/);

  assert.match(
    priceModal,
    /Are you sure you want to remove this product from the order\?/
  );

  assert.match(priceModal, /If you add it again, the updated price will apply/);
  assert.match(priceModal, /'Remove one unit'/);
  assert.match(priceModal, /'Use current price'/);
  assert.match(priceModal, /'Remove anyway'/);
  assert.match(priceModal, /<TableImagePreview/);
  assert.match(priceModal, /Previous price:/);
  assert.match(priceModal, /Current price:/);
  assert.match(priceModal, /getPharmacyProductPath\(item\.productId\)/);
  assert.match(priceModal, /className=\{css\.productLink\}/);
  assert.match(priceModal, /<AlertTriangle/);
  assert.match(priceModal, /<CloseIconButton/);
  assert.match(priceModal, /<Trash2/);
  assert.match(priceModal, /<Minus/);
  assert.match(priceModal, /<CircleCheckBig/);
  assert.match(priceModal, /isLoading=\{isLoading\}/);

  assert.match(modalStyles, /\.productLink::after/);
  assert.match(modalStyles, /transition: transform var\(--transition-base\)/);
  assert.match(modalStyles, /\.destructiveAction/);
});

//===================================================================

test('stock and price conflicts are guarded at transaction time on both order paths', async () => {
  const root = path.resolve(CURRENT_DIR, '../../../../..');

  const [manager, schema, checkout, stock, clientSubmit] = await Promise.all([
    readFile(
      path.join(
        root,
        'apps/api/src/services/orders/order-manager-orders.service.ts'
      ),
      'utf8'
    ),

    readFile(
      path.join(root, 'apps/api/src/schemas/orders/order.schema.ts'),
      'utf8'
    ),

    readFile(
      path.join(root, 'apps/api/src/services/orders/order-checkout.service.ts'),
      'utf8'
    ),

    readFile(
      path.join(root, 'apps/api/src/services/inventory/stock.service.ts'),
      'utf8'
    ),

    readFile(
      path.join(
        root,
        'apps/client/src/components/checkout/hooks/useCheckoutSubmit.ts'
      ),
      'utf8'
    ),
  ]);

  assert.match(manager, /withTransaction/);
  assert.match(manager, /reserveOfferStock/);
  assert.match(manager, /expectedUnitPrice !== offer\.price/);
  assert.match(manager, /ORDER_PRICE_CHANGED_ERROR_CODE/);

  assert.match(
    schema,
    /expectedUnitPrice: z\.number\(\)\.finite\(\)\.nonnegative\(\)\.optional\(\)/
  );

  assert.match(checkout, /withTransaction/);
  assert.match(checkout, /STOCK_CHANGED_ERROR_CODE/);
  assert.match(stock, /availableQuantity:/);
  assert.match(clientSubmit, /setStockConflictOpen\(true\)/);
  assert.match(clientSubmit, /getStockValidationError\(latestOrderGroup\)/);
});

//===================================================================

test('product picker distinguishes failed reads from empty results and uses order pharmacy scope', async () => {
  const [picker, styles, productApi] = await Promise.all([
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),

    readFile(
      path.resolve(CURRENT_DIR, '../../lib/api/browser/products.api.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    picker,
    /!isPickerLoading && !productsError && products\.length === 0/
  );

  assert.match(picker, /role="alert"/);
  assert.match(picker, /setRetryVersion/);
  assert.match(picker, /className=\{css\.productModalEmpty\}/);

  assert.match(
    styles,
    /\.productModalNotice\s*\{[\s\S]*?var\(--color-error-soft\)/
  );

  assert.match(styles, /\.productModalEmpty h3\s*\{[\s\S]*?var\(--fz-18\)/);
  assert.match(productApi, /getOrderPickerProducts/);

  assert.match(
    productApi,
    /headers: \{ 'X-Pharmacy-ID': params\.pharmacyId \}/
  );
});

//===================================================================

test('order picker presents one loading state with a persistent count below categories', async () => {
  const [picker, styles] = await Promise.all([
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.match(
    picker,
    /const isPickerLoading =\s*isLoading \|\| isLoadingCategories \|\| !hasLoadedProducts/
  );

  assert.match(
    picker,
    /const visibleItemsCount =\s*isPickerLoading \|\| productsError\s*\? 0\s*: availableProductsCount/
  );

  assert.equal((picker.match(/<ProfileResourceState/g) ?? []).length, 1);

  assert.match(
    picker,
    /className=\{css\.productModalCategories\}[\s\S]*?className=\{css\.productModalAvailableCount\} aria-live="polite"/
  );

  assert.match(picker, /\{isPickerLoading \? \(\s*<ProfileResourceState/);
  assert.match(styles, /\.productModalCategories \{[\s\S]*?min-height: 38px/);

  assert.match(
    styles,
    /\.productModalAvailableCount \{[\s\S]*?margin-bottom: 14px/
  );

  // Initial category loading has pill-sized, animated placeholders, not a blank row.
  assert.match(picker, /aria-busy=\{!categoriesReady\}/);
  assert.match(picker, /className=\{css\.productModalCategorySkeletons\}/);
  assert.match(picker, /Array\.from\(\{ length: 4 \}/);
  assert.match(styles, /\.productModalCategorySkeleton \{[\s\S]*?height: 38px/);
  assert.match(styles, /animation: order-category-shimmer/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

//===================================================================

test('continue shopping keeps modal help in the top layer and stocks aligned with saved order snapshots', async () => {
  const pickerSource = await readFile(PICKER_SOURCE, 'utf8');

  assert.match(pickerSource, /escapeOverflow\s+preferTopLayer/);
  assert.match(pickerSource, /orderItem\?\.availableQuantity !== undefined/);
  assert.match(pickerSource, /order\.id === 'draft'/);
  assert.match(pickerSource, /\{availableQuantity\}\{' '\}/);
});

//===================================================================

test('order banners distinguish created time and pharmacy, and creation targets the requested pharmacy', async () => {
  const details = await readFile(DETAILS_SOURCE, 'utf8');

  const api = await readFile(
    path.resolve(CURRENT_DIR, '../../lib/api/browser/orders.api.ts'),
    'utf8'
  );

  const table = await readFile(
    path.join(CURRENT_DIR, 'OrdersTable', 'OrdersTable.tsx'),
    'utf8'
  );

  assert.match(details, /headerMeta=\{/);
  assert.match(details, /meta=\{\s*<OrderPharmacyBadge/);
  assert.match(details, /createPharmacyOrder\([\s\S]*?order\.pharmacyId/);
  assert.match(api, /headers: \{ 'X-Pharmacy-ID': pharmacyId \}/);
  assert.match(table, /normalized\.slice\(0, 20\)/);
});

//===================================================================

test('related product orders retain the compact client comment column', async () => {
  const source = await readFile(
    path.join(CURRENT_DIR, 'OrdersTable', 'OrdersTable.tsx'),
    'utf8'
  );

  assert.match(source, /key: 'clientComment'/);
  assert.match(source, /truncateComment\(order\.clientComment\)/);
  assert.match(source, /normalized\.slice\(0, 20\)/);

  const productExclusions = source
    .split('if (\n        productId &&')[1]
    ?.split('].includes(key)')[0];

  assert.ok(
    productExclusions,
    'Expected product-specific column visibility rule'
  );

  assert.doesNotMatch(productExclusions, /'clientComment'/);
});
