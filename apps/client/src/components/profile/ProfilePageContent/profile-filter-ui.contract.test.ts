import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

const profile = read('./ProfilePageContent.tsx');

const profileState = read(
  '../../../../../../packages/ui/src/profile/ProfileResourceState.tsx'
);

const apiOrders = read(
  '../../../../../api/src/services/orders/order-query.service.ts'
);

const dto = read(
  '../../../../../../packages/api-client/src/response/shared-dto-parsers.ts'
);

//===================================================================

test('order number select loads choices across all client orders, not current page', () => {
  assert.match(
    profile,
    /<SearchableSelect\s+id="profile-orders-number-search"/
  );

  assert.match(profile, /orderNumberOptions\.map/);
  assert.match(profile, /<ClipboardList size=\{17\}/);
  assert.match(apiOrders, /Order\.distinct\('orderNumber',\s*\{\s*userId:/);
  assert.match(dto, /Array\.isArray\(record\.orderNumberOptions\)/);
});

//===================================================================

test('order method and actor filters have icons; statuses are real badges', () => {
  assert.match(profile, /deliveryMethod === 'pickup'/);
  assert.match(profile, /<Truck size=\{16\}/);
  assert.match(profile, /paymentMethod === 'cash'/);
  assert.match(profile, /<Landmark size=\{16\}/);
  assert.match(profile, /createdByType === 'client'/);
  assert.match(profile, /<UserCog size=\{16\}/);

  assert.match(
    profile,
    /content: <StatusBadge \{\.\.\.ORDER_STATUS_PRESENTATION\[status\]\} \/>/
  );
});

//===================================================================

test('profile breadcrumbs follow tab and empty states use shared icon cards', () => {
  assert.match(profile, /<Breadcrumbs items=\{profileBreadcrumbs\}/);
  assert.match(profile, /icon=\{<Heart size=\{24\}/);
  assert.match(profile, /icon=\{<Building2 size=\{24\}/);
  assert.match(profileState, /iconLeft=\{<RotateCcw/);
});
