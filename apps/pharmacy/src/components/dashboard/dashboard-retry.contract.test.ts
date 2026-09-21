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

  assert.match(
    source,
    /\[salesRetryVersion, selectedSalesMonth, selectedSalesYear\]/
  );
});
