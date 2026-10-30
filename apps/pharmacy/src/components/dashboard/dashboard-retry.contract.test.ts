import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('dashboard unavailable resources expose explicit retry generations', async () => {
  const source = await readFile(
    resolve(
      process.cwd(),
      'src/components/dashboard/PharmacyDashboardPageContent/PharmacyDashboardPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(source, /dashboardRetryVersion/);
  assert.match(source, /salesRetryVersion/);
  assert.match(source, /Retry dashboard statistics/);
  assert.match(source, /Retry sales statistics/);

  // Sales retry remains reactive to selected period, but must also wait
  // for the authenticated profile and selected pharmacy to become available.
  assert.match(
    source,
    /\[\s*isProfileLoading,\s*pharmacyId,\s*salesRetryVersion,\s*selectedSalesMonth,\s*selectedSalesYear,?\s*\]/
  );

  assert.match(source, /if \(isProfileLoading \|\| !pharmacyId\)/);
  assert.match(source, /void loadSalesStatistics\(\)/);
});
