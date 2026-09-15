import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('legacy stock backfill preserves the current balance when old orders cannot be replayed safely', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/stockMovement.service.ts'),
    'utf8'
  );

  const backfillStart = source.indexOf(
    'async function backfillLegacyStockHistory'
  );

  const reconcileStart = source.indexOf(
    'async function reconcileOfferReservationBalance',
    backfillStart
  );

  const backfillSource = source.slice(backfillStart, reconcileStart);

  assert.match(backfillSource, /let canReconstructHistory = true/);
  assert.match(backfillSource, /canReconstructHistory = false/);

  assert.match(
    backfillSource,
    /buildLegacyBalanceSnapshot\(offer, new Date\(\)\)/
  );

  assert.match(backfillSource, /return offer/);

  assert.doesNotMatch(
    backfillSource,
    /Legacy stock history cannot be reconstructed because/
  );
});

//===================================================================

test('reservation reconciliation does not turn legacy over-reservation into a failed stock-movement response', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/stockMovement.service.ts'),
    'utf8'
  );

  const reconcileStart = source.indexOf(
    'async function reconcileOfferReservationBalance'
  );

  const reconcileEnd = source.indexOf(
    'function getLatestOrderStockChangeDate',
    reconcileStart
  );

  const reconcileSource = source.slice(reconcileStart, reconcileEnd);

  assert.match(
    reconcileSource,
    /if \(reservedQuantity > offer\.totalQuantity\) \{\s*return offer;\s*\}/
  );
});

//===================================================================

test('legacy stock replay tolerates incomplete historical order metadata', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/stockMovement.service.ts'),
    'utf8'
  );

  assert.match(source, /statusHistory\?\:/);
  assert.match(source, /order\.statusHistory \?\? \[\]/);

  assert.match(
    source,
    /!Number\.isInteger\(event\.quantity\) \|\| event\.quantity < 1/
  );

  assert.match(source, /!isValidStockBalance\(\{/);
});
