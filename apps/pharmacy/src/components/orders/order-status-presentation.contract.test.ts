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

//===================================================================

const PRODUCT_REQUEST_OVERVIEW = path.resolve(
  CURRENT_DIR,
  '../product-requests/ProductRequestDetailsPageContent/ProductRequestOverview.tsx'
);

const PRODUCT_REQUEST_HISTORY = path.resolve(
  CURRENT_DIR,
  '../product-requests/NewProductRequestPageContent/ProductRequestDetailSections.tsx'
);

const CLIENT_SOURCE = path.resolve(
  CURRENT_DIR,
  '../clients/ClientDetailsPageContent/ClientInformationTab.tsx'
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
  assert.match(source, /labelSupplement=\{/);
  assert.match(source, /<OrderRejectionSourceBadge/);
  assert.match(source, /This order is in progress/);
  assert.match(source, /This order was completed successfully/);
  assert.match(source, /This order was rejected/);
  assert.doesNotMatch(source, /className=\{css\.lockNotice\}/);

  assert.match(source, /statusActions\.map\([\s\S]{0,1000}<CirclePlay/);
  assert.match(source, /<CircleCheckBig/);
  assert.match(source, /<CircleX/);

  assert.match(
    source,
    /clientStatusRowWithActions[\s\S]{0,160}clientStatusRowClientOnly/
  );

  assert.match(source, /Manage order status/);
  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /aria-expanded=\{isStatusMenuOpen\}/);
  assert.match(source, /statusActions\.map[\s\S]{0,1900}detailsClientBadge/);
  assert.match(source, /getStatusActionLabel\(status\)/);
  assert.match(source, /onClick=\{\(\) => handleStatusClick\(status\)\}/);

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

test('order status menu mirrors pharmacy actions without bypassing confirmation', async () => {
  const [source, styles] = await Promise.all([
    readFile(ORDER_SOURCE, 'utf8'),
    readFile(ORDER_STYLES, 'utf8'),
  ]);

  assert.match(source, /getOrderStatusTransitions\(order\.status\)/);
  assert.match(source, /statusActions\.length > 0/);
  assert.match(source, /disabled=\{areStatusActionsDisabled\}/);
  assert.match(source, /className=\{css\.statusMenuOptions\}/);
  assert.match(source, /role="menu"/);
  assert.match(source, /role="menuitem"/);
  assert.match(source, /css\.rejectStatusAction/);
  assert.match(source, /css\.approveStatusAction/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /document\.addEventListener\('pointerdown'/);
  assert.match(source, /setPendingStatus\(\{ status \}\)/);
  assert.match(source, /<OrderCancellationModal/);
  assert.match(source, /onConfirm=\{\(\) => void handleConfirmStatus\(\)\}/);
  assert.match(styles, /\.statusMenuOptions\s*\{/);
  assert.match(styles, /\.approveStatusAction\s*\{/);
  assert.match(styles, /\.rejectStatusAction\s*\{/);
  assert.doesNotMatch(source, /css\.rejectButton/);
});

//===================================================================

test('product requests align status copy with metadata and expose rejection reason', async () => {
  const [overview, history] = await Promise.all([
    readFile(PRODUCT_REQUEST_OVERVIEW, 'utf8'),
    readFile(PRODUCT_REQUEST_HISTORY, 'utf8'),
  ]);

  assert.match(overview, /<ProductRequestStatusBadges request=\{request\} \/>/);
  assert.match(overview, /Last update date/);
  assert.match(overview, /formatShortDate\(request\.updatedAt\)/);

  assert.match(
    history,
    /entry\.status === 'rejected' && request\.rejectionReason/
  );

  assert.match(history, /Rejection reason:/);
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

//===================================================================

test('tablet order banners keep final status metadata next to titles and pharmacy labels left aligned', async () => {
  const [details, styles, banner, bannerStyles] = await Promise.all([
    readFile(ORDER_SOURCE, 'utf8'),
    readFile(ORDER_STYLES, 'utf8'),
    readFile(STATUS_BANNER_SOURCE, 'utf8'),
    readFile(STATUS_BANNER_STYLES, 'utf8'),
  ]);

  assert.match(details, /css\.selectedPharmacyBadge/);

  assert.match(
    styles,
    /\.selectedPharmacyBadge > span:last-child\s*\{[\s\S]*?text-align: left/
  );

  assert.match(banner, /headerMeta && css\.withHeaderMeta/);
  assert.match(bannerStyles, /min-width: 768px\) and \(max-width: 1439px/);

  assert.match(
    bannerStyles,
    /\.inlineMeta\.withHeaderMeta \.header\s*\{[^}]*display: flex/
  );

  assert.match(details, /formatTableDateTimeParts\(value\)/);
  assert.match(details, /Created \{formatOrderCreatedAt\(order\.orderDate\)\}/);
  assert.match(styles, /\.orderHeaderMeta\s*\{[\s\S]*?white-space: nowrap/);

  assert.match(
    bannerStyles,
    /\.inlineMeta\.withHeaderMeta \.headerTrailing\s*\{[^}]*width: max-content/
  );

  assert.match(
    bannerStyles,
    /\.inlineMeta\.withHeaderMeta \.badgeGroup\s*\{[^}]*flex-wrap: nowrap/
  );
});
