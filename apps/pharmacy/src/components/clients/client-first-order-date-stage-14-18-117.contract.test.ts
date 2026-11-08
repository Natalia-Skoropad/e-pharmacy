import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (name: string) => readFile(resolve(process.cwd(), name), 'utf8');

//===================================================================

test('purchased products date drawer only offers actual first-order days across all pages', async () => {
  const [details, drawer, calendar] = await Promise.all([
    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailFilters.tsx'
    ),

    read('../../packages/ui/src/forms/DateFilter/DateFilter.tsx'),
  ]);

  assert.match(
    details,
    /setProductsAvailableFirstOrderDates\(response\.availableFirstOrderDates\)/
  );

  assert.match(details, /availableDates=\{productsAvailableFirstOrderDates\}/);
  assert.match(drawer, /minDate=\{availableDates\[0\]\}/);

  assert.match(
    drawer,
    /maxDate=\{availableDates\[availableDates\.length - 1\]\}/
  );

  assert.match(drawer, /availableDates=\{availableDates\}/);
  assert.match(calendar, /!availableDayKeys\.has\(date\)/);
  assert.match(calendar, /availableDayKeys\.has\(today\)/);
});

//===================================================================

test('client products API validates distinct calendar-date availability', async () => {
  const contract = await read('src/lib/clients/clients.ts');

  assert.match(contract, /function parseAvailableFirstOrderDates/);

  assert.match(
    contract,
    /dates\.every\(\(date\) => isCalendarDateString\(date\)\)/
  );

  assert.match(contract, /return \[\.\.\.new Set\(dates\)\]\.sort\(\)/);
});
