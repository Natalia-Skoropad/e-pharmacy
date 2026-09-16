import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

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
  'OrdersPageContent',
  'OrdersPageContent.tsx'
);

const PRODUCT_SOURCE = path.resolve(
  CURRENT_DIR,
  '../all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
);

const PICKER_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'ProductPickerModal.tsx'
);

//===================================================================

test('client search help documents all supported identifiers', async () => {
  const [ordersSource, productSource, detailsSource] = await Promise.all([
    readFile(ORDERS_SOURCE, 'utf8'),
    readFile(PRODUCT_SOURCE, 'utf8'),
    readFile(DETAILS_SOURCE, 'utf8'),
  ]);

  const normalizeWhitespace = (source: string) => source.replace(/\s+/g, ' ');
  const help = 'Search by client name, ID, email, phone number, or address.';

  assert.match(ordersSource, /label="Client search"/);
  assert.ok(normalizeWhitespace(ordersSource).includes(help));
  assert.ok(normalizeWhitespace(productSource).includes(help));
  assert.ok(normalizeWhitespace(detailsSource).includes(help));
  assert.match(detailsSource, /searchText:/);
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
  assert.match(styles, /\.deliveryAddressError\s*\{/);
});
