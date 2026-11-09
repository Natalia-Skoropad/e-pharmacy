import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const readPharmacy = (path: string) =>
  readFile(resolve(process.cwd(), path), 'utf8');

const readShared = (path: string) =>
  readFile(resolve(process.cwd(), '../..', path), 'utf8');

//===================================================================

test('owner sales filter includes a pharmacy ID in the shared request type', async () => {
  const [apiClient, statisticsTab] = await Promise.all([
    readShared(
      'packages/api-client/src/response/order-sales-statistics-parsers.ts'
    ),

    readPharmacy(
      'src/components/products/OwnProductDetailsPageContent/OwnProductStatisticsTab.tsx'
    ),
  ]);

  assert.match(
    apiClient,
    /export type OrderSalesStatisticsQueryParams = Readonly<\{[\s\S]*?pharmacyId\?: string;/
  );

  assert.match(statisticsTab, /pharmacyId: pharmacyId \|\| undefined,/);
  assert.match(statisticsTab, /scope: 'owner'/);
  assert.doesNotMatch(statisticsTab, /type SalesPeriodMonth,/);
});
