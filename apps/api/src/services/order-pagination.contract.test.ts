import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function readOrderService(): Promise<string> {
  return readFile(resolve(__dirname, 'order.service.ts'), 'utf8');
}

//===================================================================

test('orders clamp stale pages before applying skip and limit', async () => {
  const source = await readOrderService();
  const start = source.indexOf('export async function getOrdersService');

  const end = source.indexOf(
    'export async function getOrderByIdService',
    start
  );

  const ordersSource = source.slice(start, end);

  const countIndex = ordersSource.indexOf('Order.countDocuments(filter)');

  const pageIndex = ordersSource.indexOf(
    'const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages)'
  );

  const findIndex = ordersSource.indexOf(
    'const orders = await Order.find(filter)'
  );

  const skipIndex = ordersSource.indexOf('.skip(skip)', findIndex);

  assert.ok(countIndex >= 0);
  assert.ok(pageIndex > countIndex);
  assert.ok(findIndex > pageIndex);
  assert.ok(skipIndex > findIndex);
  assert.match(ordersSource, /const skip = \(page - 1\) \* query\.perPage/);
  assert.match(ordersSource, /page,\s*perPage: query\.perPage/);
  assert.doesNotMatch(ordersSource, /page:\s*total === 0 \? 1 : query\.page/);
});
