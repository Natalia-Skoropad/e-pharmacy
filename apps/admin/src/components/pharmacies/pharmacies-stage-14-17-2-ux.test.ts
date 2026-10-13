import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('14.17.2: pharmacy status and rating select retain textual accessibility while rendering rich options', () => {
  const filters = read('./PharmaciesFiltersDrawer/PharmaciesFiltersDrawer.tsx');

  const select = read(
    '../../../../../packages/ui/src/forms/SelectField/SelectField.tsx'
  );

  assert.match(
    filters,
    /content:\s*<StatusBadge \{\.\.\.PHARMACY_STATUS_PRESENTATION\[status\]\}/
  );

  assert.match(filters, /<Star size=\{15\} fill="currentColor"/);
  assert.match(filters, /ratingIcon/);
  assert.match(select, /label: string;\s*content\?: ReactNode/);
  assert.match(select, /option\.content \?\? option\.label/);

  assert.match(
    select,
    /selectedOption\?\.content \?\? selectedOption\?\.label/
  );

  assert.match(select, /option\.label\.toLocaleLowerCase\(\)/);
});

//===================================================================

test('14.17.2: shared filter drawer reset control shows the icon without changing the public reset button', () => {
  const drawer = read(
    '../../../../../packages/ui/src/overlays/FilterDrawer/FilterDrawer.tsx'
  );

  assert.match(drawer, /<RotateCcw size=\{17\} aria-hidden="true"/);
  assert.match(drawer, /\{resetLabel\}/);
  assert.match(drawer, /hasActiveFilters && \(resetHref \|\| onReset\)/);
});

//===================================================================

test('14.17.2: pharmacy navigation has permission-gated fresh status totals on desktop and mobile', () => {
  const layout = read('../../app/admin/layout.tsx');

  const provider = read(
    '../../providers/AdminPharmacyNavigationBadgeProvider/AdminPharmacyNavigationBadgeProvider.tsx'
  );

  const badges = read(
    '../layout/PharmacyNavigationBadges/PharmacyNavigationBadges.tsx'
  );

  const desktop = read('../layout/AdminSidebar/AdminSidebar.tsx');
  const mobile = read('../layout/AdminMobileMenu/AdminMobileMenu.tsx');

  assert.match(layout, /<AdminPharmacyNavigationBadgeProvider>/);
  assert.match(provider, /ADMIN_PERMISSIONS\.pharmacies\.view/);

  assert.match(
    provider,
    /getAdminPharmacySummary\(\{ signal: controller\.signal \}\)/
  );

  assert.match(provider, /subscribeToPharmacyModerationRefresh/);
  assert.match(provider, /window\.addEventListener\('focus', refresh\)/);
  assert.match(provider, /controller\.abort\(\)/);
  assert.match(provider, /counts: null/);

  for (const key of ['new', 'onVerification', 'onModeration']) {
    assert.match(badges, new RegExp(`key: '${key}'`));
    assert.match(provider, new RegExp(`${key}: summary\\.${key}`));
  }

  assert.match(
    desktop,
    /<PharmacyNavigationBadges\s+counts=\{pharmacyCounts\}\s+collapsed=\{isCollapsed\}/
  );

  assert.match(mobile, /<PharmacyNavigationBadges counts=\{pharmacyCounts\}/);
});

//===================================================================

test('14.17.2: both order metrics have one canonical icon-rich tooltip and the currency is only in the header', () => {
  const registry = read('./PharmaciesPageContent/PharmaciesPageContent.tsx');

  const clients = read(
    '../../../../pharmacy/src/components/clients/ClientsTable/ClientsTable.tsx'
  );

  const tooltip = read(
    '../../../../../packages/ui/src/overlays/OrderMetricsTooltip/OrderMetricsTooltip.tsx'
  );

  assert.equal(
    (registry.match(/<OrderMetricsTooltip scope="pharmacy"/g) ?? []).length,
    2
  );

  assert.equal(
    (clients.match(/<OrderMetricsTooltip scope="client"/g) ?? []).length,
    2
  );

  assert.match(registry, /formatAmount\(pharmacy\.successfulRevenue\)/);
  assert.doesNotMatch(registry, /formatMoney\(pharmacy\.successfulRevenue\)/);
  assert.match(tooltip, /<ShoppingBag/);
  assert.match(tooltip, /<ListOrdered/);
  assert.match(tooltip, /<Wallet/);
  assert.match(tooltip, /status Successful/);
});
