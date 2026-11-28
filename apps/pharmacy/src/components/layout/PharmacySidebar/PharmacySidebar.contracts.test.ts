import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('order counters refresh from owner-wide or URL-scoped Orders selection and explicit signals', async () => {
  const source = await readFile(
    new URL('../../../hooks/usePharmacyNavigationCounters.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /response\.statistics\.new\.count/);
  assert.match(source, /response\.statistics\.in_progress\.count/);
  assert.match(source, /subscribeToOrderCounterRefresh/);
  assert.match(source, /addEventListener\('focus'/);
  assert.match(source, /scope: 'owner' as const/);

  assert.match(
    source,
    /const onFocus = \(\) => \{\s*if \(!activeController\) void loadOrderCounts\(\);/
  );

  assert.match(source, /orderScopePharmacyId/);
  assert.match(source, /parseOrdersSegments/);

  assert.match(
    source,
    /\}, \[enabled, currentUserId, orderCounterScopeKey, orderScopePharmacyId\]\);/
  );

  assert.equal(source.includes('}, [pathname]);'), false);
  assert.match(source, /@\/lib\/api\/browser\/orders\.api/);
});

//===================================================================

test('counter refresh aborts the previous generation before starting another', async () => {
  const source = await readFile(
    new URL('../../../hooks/usePharmacyNavigationCounters.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /activeController\?\.abort\(\)/);
  assert.match(source, /currentVersion !== requestVersion/);
  assert.match(source, /controller\.signal\.aborted/);
});

//===================================================================

test('collapsed order notifications remain visible and expanded badges expose semantic labels', async () => {
  const [source, css] = await Promise.all([
    readFile(new URL('./PharmacySidebar.tsx', import.meta.url), 'utf8'),
    readFile(new URL('./PharmacySidebar.module.css', import.meta.url), 'utf8'),
  ]);

  assert.match(source, /isCollapsed && hasNotifications && orderCounts/);
  assert.match(source, /getCollapsedOrderNotificationLabel\(orderCounts\)/);
  assert.match(source, /getOrderCountAriaLabel/);
  assert.match(source, /formatVisibleOrderCount/);
  assert.match(css, /\.collapsedOrderCounters\s*\{/);
  assert.match(source, /orderCounts.new > 0[\s\S]*?css\.collapsedNewDot/);

  assert.match(
    source,
    /orderCounts.inProgress > 0[\s\S]*?css\.collapsedModerationDot/
  );

  assert.match(source, /css\.collapsedPharmacyCounters/);
  assert.match(source, /pharmacyCounts\.onVerification > 0/);
  assert.match(css, /\.collapsedPharmacyCounters > span/);

  // Center the complete dot group over the collapsed navigation icon,
  // irrespective of the number of visible pharmacy/order statuses.
  for (const selector of [
    'collapsedPharmacyCounters',
    'collapsedOrderCounters',
    'collapsedProductRequestCounters',
  ]) {
    const rule = css.match(
      new RegExp(`\\.${selector}(?:,\\s*\\.[a-zA-Z]+)?\\s*\\{([^}]+)\\}`)
    )?.[1];

    assert.ok(rule, `${selector} must have a style rule`);
    assert.match(rule, /left:\s*50%/);
    assert.match(rule, /transform:\s*translateX\(-50%\)/);
    assert.doesNotMatch(rule, /right:\s*\d/);
  }

  for (const dot of ['New', 'Verification', 'Moderation', 'Reactivation']) {
    assert.match(css, new RegExp(`\\.collapsed${dot}Dot`));
    assert.match(source, new RegExp(`css\\.collapsed${dot}Dot`));
  }
});

//===================================================================

test('product request navigation counters use owner-wide statistics and refresh after mutations', async () => {
  const [hook, api, sidebar] = await Promise.all([
    readFile(
      new URL(
        '../../../hooks/usePharmacyNavigationCounters.ts',
        import.meta.url
      ),
      'utf8'
    ),

    readFile(
      new URL(
        '../../../lib/api/browser/product-requests.api.ts',
        import.meta.url
      ),
      'utf8'
    ),

    readFile(new URL('./PharmacySidebar.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(hook, /getPharmacyProductRequestStatistics/);
  assert.match(hook, /new: stats\.new/);
  assert.match(hook, /onModeration: stats\.on_moderation/);
  assert.doesNotMatch(hook, /draft: stats\.draft/);
  assert.match(hook, /subscribeToProductRequestCounterRefresh/);
  assert.match(hook, /active\.signal\.aborted/);
  assert.match(api, /dispatchProductRequestCounterRefresh/);
  assert.match(sidebar, /useProductRequestNavigationCounts/);
  assert.match(sidebar, /css\.collapsedProductRequestCounters/);
  assert.match(sidebar, /productRequestCounts\.new > 0/);
  assert.match(sidebar, /productRequestCounts\.onModeration > 0/);
  assert.doesNotMatch(sidebar, /productRequestCounts\.draft/);
  assert.doesNotMatch(sidebar, /productRequestCounts\.inProgress/);
});
