import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

test('cart persistence stores intent only while response prices stay live', async () => {
  const [model, types, service, migration] = await Promise.all([
    readFile(path.resolve(process.cwd(), 'src/models/cart.model.ts'), 'utf8'),
    readFile(path.resolve(process.cwd(), 'src/types/cart.ts'), 'utf8'),

    readFile(
      path.resolve(process.cwd(), 'src/services/cart.service.ts'),
      'utf8'
    ),

    readFile(
      path.resolve(process.cwd(), 'src/scripts/migrate-domain-entities.ts'),
      'utf8'
    ),
  ]);

  assert.doesNotMatch(model, /unitPrice\s*:/);

  const entityStart = types.indexOf('export type CartItemEntity');
  const entityEnd = types.indexOf('export type CartEntity');
  const entitySource = types.slice(entityStart, entityEnd);
  assert.doesNotMatch(entitySource, /unitPrice/);

  const serializeStart = service.indexOf(
    'async function serializeCartWithCleanup'
  );

  const cleanupStart = service.indexOf(
    'export async function cleanupExpiredCartItemsService'
  );

  const serializeSource = service.slice(serializeStart, cleanupStart);

  assert.match(serializeSource, /const unitPrice = offer\.price/);
  assert.match(serializeSource, /unitPrice,/);
  assert.match(serializeSource, /totalPrice: item\.quantity \* unitPrice/);

  const addStart = service.indexOf('export async function addCartItemService');

  const removeStart = service.indexOf(
    'export async function removeCartItemService'
  );

  const mutationSource = service.slice(addStart, removeStart);
  assert.doesNotMatch(mutationSource, /unitPrice\s*:/);
  assert.match(service, /const persistedItems = items\.map/);
  assert.match(service, /\$set: \{ items: persistedItems \}/);

  const cartMigrationStart = migration.indexOf(
    '// Cart references ProductOffer directly'
  );

  const orderMigrationStart = migration.indexOf(
    '// Orders keep immutable snapshots'
  );

  const cartMigrationSource = migration.slice(
    cartMigrationStart,
    orderMigrationStart
  );

  assert.doesNotMatch(cartMigrationSource, /unitPrice\s*:/);
});
