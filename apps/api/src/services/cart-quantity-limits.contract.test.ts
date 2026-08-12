import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

test('cart add never silently clamps requested quantity and enforces the shared max', async () => {
  const [service, model] = await Promise.all([
    readFile(
      path.resolve(process.cwd(), 'src/services/cart.service.ts'),
      'utf8'
    ),
    readFile(path.resolve(process.cwd(), 'src/models/cart.model.ts'), 'utf8'),
  ]);

  assert.doesNotMatch(
    service,
    /Math\.min\(input\.quantity, offer\.availableQuantity\)/
  );

  assert.doesNotMatch(service, /Math\.max\(1, quantity\)/);
  assert.match(service, /nextQuantity < 1/);
  assert.match(service, /nextQuantity > CART_ITEM_MAX_QUANTITY/);
  assert.match(service, /nextQuantity > offer\.availableQuantity/);
  assert.match(service, /STOCK_CHANGED_ERROR_CODE/);
  assert.match(model, /max: CART_ITEM_MAX_QUANTITY/);
});
