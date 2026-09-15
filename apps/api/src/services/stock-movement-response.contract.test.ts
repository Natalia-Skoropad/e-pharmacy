import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('stock movement response keeps the canonical pagination envelope expected by the pharmacy client', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/stockMovement.service.ts'),
    'utf8'
  );

  const serviceStart = source.indexOf(
    'export async function getProductStockMovementsService'
  );

  const serviceSource = source.slice(serviceStart);

  assert.match(serviceSource, /page: 1/);
  assert.match(serviceSource, /perPage: Math\.max\(rows\.length, 1\)/);
  assert.match(serviceSource, /total: rows\.length/);
  assert.match(serviceSource, /totalPages: rows\.length > 0 \? 1 : 0/);
});
