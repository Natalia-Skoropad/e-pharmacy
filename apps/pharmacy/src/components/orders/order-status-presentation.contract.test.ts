import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

//===================================================================

const ORDER_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.tsx'
);

const ORDER_STYLES = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.module.css'
);

const CANCELLATION_SOURCE = path.join(
  CURRENT_DIR,
  'OrderCancellationModal',
  'OrderCancellationModal.tsx'
);

const CANCELLATION_STYLES = path.join(
  CURRENT_DIR,
  'OrderCancellationModal',
  'OrderCancellationModal.module.css'
);

//===================================================================

const PRODUCT_REQUEST_SOURCE = path.resolve(
  CURRENT_DIR,
  '../product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
);

const CLIENT_SOURCE = path.resolve(
  CURRENT_DIR,
  '../clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
);

const STATUS_BANNER_SOURCE = path.resolve(
  CURRENT_DIR,
  '../../../../../packages/ui/src/statistics/StatusBanner/StatusBanner.tsx'
);

const STATUS_BANNER_STYLES = path.resolve(
  CURRENT_DIR,
  '../../../../../packages/ui/src/statistics/StatusBanner/StatusBanner.module.css'
);

//===================================================================

test('orders share one status summary layout across draft and persisted states', async () => {
  const [source, styles, bannerSource, bannerStyles] = await Promise.all([
    readFile(ORDER_SOURCE, 'utf8'),
    readFile(ORDER_STYLES, 'utf8'),
    readFile(STATUS_BANNER_SOURCE, 'utf8'),
    readFile(STATUS_BANNER_STYLES, 'utf8'),
  ]);

  assert.match(source, /tone="neutral"[\s\S]{0,120}label="Draft"/);
  assert.match(source, /ORDER_STATUS_PRESENTATION\[order\.status\]/);
  assert.match(source, /getOrderStatusSummary\(order\.status\)/);
  assert.match(source, /inlineMeta/);
  assert.match(source, /This order is in progress/);
  assert.match(source, /This order was completed successfully/);
  assert.match(source, /This order was rejected/);
  assert.doesNotMatch(source, /className=\{css\.lockNotice\}/);

  assert.match(source, /iconLeft={[\s\S]{0,160}<CirclePlay/);
  assert.match(source, /<CircleCheckBig/);
  assert.match(source, /<CircleX/);

  assert.match(
    source,
    /clientStatusRowWithActions[\s\S]{0,160}clientStatusRowClientOnly/
  );

  assert.match(source, /statusActions\.map[\s\S]{0,1200}detailsClientBadge/);

  assert.match(
    styles,
    /\.clientStatusRowWithActions\s*\{[\s\S]{0,120}'actions'[\s\S]{0,80}'client'/
  );

  assert.match(
    styles,
    /@media only screen and \(min-width: 768px\)[\s\S]{0,1200}\.clientStatusRowWithActions\s*\{[\s\S]{0,180}grid-template-areas:\s*'client actions'/
  );

  assert.match(
    styles,
    /\.clientStatusRowClientOnly\s*\{[\s\S]{0,100}grid-template-areas:\s*'client'/
  );

  assert.match(
    styles,
    /\.selectedClientPreview\s*\{[\s\S]{0,120}min-height:\s*48px/
  );

  assert.match(bannerSource, /inlineMeta\?: boolean/);

  assert.match(
    bannerStyles,
    /\.inlineMeta \.meta\s*\{[\s\S]{0,80}justify-content:\s*flex-start/
  );

  assert.match(
    bannerStyles,
    /@media only screen and \(min-width: 768px\)[\s\S]{0,500}\.inlineMeta \.message/
  );
});

//===================================================================

test('cancellation modal keeps mobile actions stacked and desktop actions inline', async () => {
  const [source, styles] = await Promise.all([
    readFile(CANCELLATION_SOURCE, 'utf8'),
    readFile(CANCELLATION_STYLES, 'utf8'),
  ]);

  assert.match(source, /errorClassName=\{css\.commentError\}/);
  assert.match(styles, /\.commentError\s*\{[\s\S]{0,60}bottom:\s*8px/);

  assert.match(
    styles,
    /\.actions\s*\{[\s\S]{0,120}grid-template-columns:\s*minmax\(0, 1fr\)/
  );

  assert.match(
    styles,
    /@media only screen and \(min-width: 768px\)[\s\S]{0,180}grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
  );
});

//===================================================================

test('product requests align status copy with metadata and expose rejection reason', async () => {
  const source = await readFile(PRODUCT_REQUEST_SOURCE, 'utf8');

  assert.match(
    source,
    /PRODUCT_REQUEST_STATUS_PRESENTATION\[request\.status\][\s\S]{0,180}inlineMeta/
  );

  assert.match(source, /Last updated \{formatDateTime\(request\.updatedAt\)/);

  assert.match(
    source,
    /entry\.status === 'rejected' && request\.rejectionReason/
  );

  assert.match(source, /Rejection reason:/);
});

//===================================================================

test('active clients receive a success-toned information summary', async () => {
  const source = await readFile(CLIENT_SOURCE, 'utf8');

  assert.match(source, /client\.status === 'active'/);
  assert.match(source, /css\.statusReasonActive/);
  assert.match(source, /<strong>Active client<\/strong>/);

  assert.match(
    source,
    /The client account is active and can place orders without[\s\S]{0,80}additional account restrictions\./
  );
});
