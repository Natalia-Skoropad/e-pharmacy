import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const root = resolve(process.cwd(), 'src/services/inventory');

const modules = [
  'stock-movement-types.ts',
  'stock-movement-balance.ts',
  'stock-movement-write.service.ts',
  'stock-movement-legacy.service.ts',
  'stock-movement-reconcile.service.ts',
  'stock-movement-projection.ts',
  'stock-movement-read.service.ts',
] as const;

const read = (name: string) => readFile(resolve(root, name), 'utf8');

//===============================================================

test('S10.7 uses direct stock movement services without retaining the monolith or a proxy', async () => {
  await assert.rejects(access(resolve(root, 'stockMovement.service.ts')), {
    code: 'ENOENT',
  });

  const [controller, management, stock] = await Promise.all([
    readFile(
      resolve(process.cwd(), 'src/controllers/product.controller.ts'),
      'utf8'
    ),

    readFile(
      resolve(
        process.cwd(),
        'src/services/catalog/product-management.service.ts'
      ),
      'utf8'
    ),

    read('stock.service.ts'),
  ]);

  assert.match(controller, /inventory\/stock-movement-read\.service/);
  assert.match(management, /inventory\/stock-movement-write\.service/);
  assert.match(stock, /from '\.\/stock-movement-write\.service'/);
  assert.match(stock, /from '\.\/stock-movement-types'/);
  assert.doesNotMatch(stock, /^type StockOfferSnapshot\s*=/m);

  for (const source of [controller, management, stock]) {
    assert.doesNotMatch(source, /stockMovement\.service/);
  }

  for (const name of modules) {
    const source = await read(name);

    assert.doesNotMatch(source, /^export\s*\{[^}]+\}\s*from\s*['"]/m);

    assert.match(
      source,
      /(?:export )?(?:async )?function|(?:export )?(?:const|type)/
    );
  }
});

//===============================================================

test('S10.7 stock movement modules have no cycles or unresolved relative imports', async () => {
  const sources = new Map<string, string>();

  for (const name of modules) sources.set(name, await read(name));

  const visited = new Set<string>();
  const active = new Set<string>();

  const walk = (name: string) => {
    assert.ok(!active.has(name), `Stock movement module cycle at ${name}`);

    if (visited.has(name)) return;

    const source = sources.get(name);

    assert.ok(source, `Missing stock movement module ${name}`);
    active.add(name);

    for (const match of source.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
      const file = `${match[1]!.slice(2)}.ts`;

      assert.ok(
        existsSync(resolve(root, file)),
        `Unresolved local import: ${file}`
      );

      if (sources.has(file)) walk(file);
    }

    active.delete(name);
    visited.add(name);
  };

  for (const name of modules) walk(name);

  assert.equal(visited.size, modules.length);
});

//===============================================================

test('S10.7 stock ledger writes enforce valid balances and preserve passed Mongo sessions', async () => {
  const [write, balance, stock] = await Promise.all([
    read('stock-movement-write.service.ts'),
    read('stock-movement-balance.ts'),
    read('stock.service.ts'),
  ]);

  assert.match(balance, /reservedQuantity <= stockQuantity/);

  assert.match(
    balance,
    /availableQuantity === stockQuantity - reservedQuantity/
  );

  assert.match(write, /assertStockBalance\(\{/);

  assert.match(
    write,
    /await StockMovement\.create\(\[document\], \{ session \}\)/
  );

  assert.match(write, /await StockMovement\.create\(document\)/);
  assert.match(write, /eventType: 'arrival'/);
  assert.match(write, /await recordStockMovement\(\{/);
  assert.match(stock, /await recordMovementIfNeeded\(/);
  assert.match(stock, /session\s*\);/);
});

//===============================================================

test('S10.7 legacy backfill and reservation reconciliation preserve balances under transaction', async () => {
  const [legacy, reconcile, readService] = await Promise.all([
    read('stock-movement-legacy.service.ts'),
    read('stock-movement-reconcile.service.ts'),
    read('stock-movement-read.service.ts'),
  ]);

  assert.match(legacy, /StockMovement\.exists\(\{/);
  assert.match(legacy, /\.session\(session\)/);
  assert.match(legacy, /if \(!canReconstructHistory\)/);
  assert.match(legacy, /buildLegacyBalanceSnapshot\(offer, new Date\(\)\)/);
  assert.match(legacy, /StockMovement\.insertMany\(documents, \{ session \}\)/);

  assert.match(
    reconcile,
    /if \(reservedQuantity > offer\.totalQuantity\)\s*\{\s*return offer;/
  );

  assert.match(reconcile, /assertStockBalance\(\{/);

  assert.match(
    reconcile,
    /returnDocument: 'after', runValidators: true, session/
  );

  assert.match(readService, /session\.withTransaction\(async \(\) => \{/);

  assert.match(
    readService,
    /await backfillLegacyStockHistory\(offer, session\)/
  );

  assert.match(
    readService,
    /reconcileOfferReservationBalance\(offerWithHistory, session\)/
  );
});

//===============================================================

test('S10.7 stock movement history remains pharmacy-scoped and keeps order aggregation and response contract', async () => {
  const [readService, projection] = await Promise.all([
    read('stock-movement-read.service.ts'),
    read('stock-movement-projection.ts'),
  ]);

  assert.match(readService, /requirePharmacyCapability\(userId, 'read_stock'/);
  assert.match(readService, /productId,\s*pharmacyId: pharmacy\._id/);
  assert.match(readService, /movements\.flatMap/);
  assert.match(readService, /aggregateOrderMovements\(/);
  assert.match(readService, /page: 1/);
  assert.match(readService, /perPage: Math\.max\(rows\.length, 1\)/);
  assert.match(readService, /totalPages: rows\.length > 0 \? 1 : 0/);
  assert.match(projection, /orderStatus === 'successful'/);
  assert.match(projection, /orderStatus === 'rejected'/);
  assert.match(projection, /getLatestOrderStockChangeDate/);
  assert.match(projection, /orderStatusAtEvent:/);
});
