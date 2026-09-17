import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { ordersQuerySchema } from '../schemas/order.schema';

//===============================================================

const servicePath = resolve(process.cwd(), 'src/services/order.service.ts');

//===============================================================

test('order client search covers historical and current client identity fields', async () => {
  const source = await readFile(servicePath, 'utf8');

  const start = source.indexOf(
    'async function createOrderClientSearchCondition'
  );

  const end = source.indexOf('function assertManagerOrderReplayMatches', start);
  const searchSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);

  for (const field of [
    'clientSnapshot.name',
    'clientSnapshot.email',
    'clientSnapshot.phone',
    'clientSnapshot.address',
    'delivery.details.recipientName',
    'delivery.details.recipientPhone',
    'delivery.details.address',
  ]) {
    assert.match(searchSource, new RegExp(field.replaceAll('.', '\\.')));
  }

  for (const currentUserField of ['name', 'email', 'phone', 'address']) {
    assert.match(
      searchSource,
      new RegExp(`\\{ ${currentUserField}: searchRegExp \\}`)
    );
  }

  assert.match(searchSource, /\$toString: '\$userId'/);
  assert.match(source, /filter\.\$and = \[/);

  assert.doesNotMatch(
    source,
    /filter\['delivery\.details\.recipientName'\] = createSafeRegExp/
  );
});

//===============================================================

test('order client search accepts email and phone syntax', () => {
  for (const client of [
    'client@example.com',
    '+380672221110',
    '+38 (067) 222-11-10',
  ]) {
    const result = ordersQuerySchema.safeParse({ client });
    assert.equal(result.success, true, `Expected ${client} to be searchable`);
  }
});
