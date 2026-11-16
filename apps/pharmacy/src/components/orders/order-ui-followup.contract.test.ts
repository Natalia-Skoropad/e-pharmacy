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

//===================================================================

test('client search help documents all supported identifiers', async () => {
  const [ordersSource, productSource, detailsSource, clientSelectSource] =
    await Promise.all([
      readFile(ORDERS_SOURCE, 'utf8'),
      readFile(PRODUCT_SOURCE, 'utf8'),
      readFile(DETAILS_SOURCE, 'utf8'),
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
    readFile(DETAILS_SOURCE, 'utf8'),
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
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.doesNotMatch(detailsSource, />\s*ProductDetails details\s*</);
  assert.match(detailsSource, />\s*Details\s*</);
  assert.doesNotMatch(detailsSource, />\s*Add products\s*</);
  assert.match(detailsSource, /Click “Add more products”/);
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
  const source = await readFile(DETAILS_SOURCE, 'utf8');

  assert.match(source, /getOrderTabs\(isCreateMode: boolean\)/);
  assert.match(source, /if \(!isCreateMode\)/);
  assert.match(source, /const canSaveCreateOrder = Boolean\(/);

  assert.match(
    source,
    /isCreateMode && isEditable && order && selectedClientId/
  );

  assert.match(source, /hasValidationErrors\(deliveryErrors\)/);
  assert.match(source, /disabled=\{!canSaveCreateOrder\}/);

  assert.match(
    source,
    /!isCreateMode \? <div className=\{css\.methodHeader\}>/
  );

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
    readFile(DETAILS_SOURCE, 'utf8'),
    readFile(PICKER_SOURCE, 'utf8'),
    readFile(DETAILS_STYLES, 'utf8'),
  ]);

  assert.match(
    source,
    /<CategoryIcon name=\{categoryIcons\[item\.category\.slug\]\}/
  );

  assert.match(source, /destructive[\s\S]*?confirmIconLeft=\{<Trash2/);
  assert.match(source, /className=\{css\.bankCopyAction\}/);
  assert.match(picker, /getProductCategories/);
  assert.match(picker, /<ProfileResourceState/);
  assert.match(picker, /[Nn]ame, article, or product ID/);
  assert.match(picker, /categoryIcons\[product\.category\.slug\]/);
  assert.match(styles, /\.bankList \.bankRow\s*\{/);
});
