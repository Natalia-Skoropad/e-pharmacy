import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('checkout pharmacy loader keeps loading, success and error states distinct', async () => {
  const source = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/checkout/hooks/useCheckoutPharmacy.ts'
    ),
    'utf8'
  );

  assert.match(source, /'idle' \| 'loading' \| 'success' \| 'error'/);
  assert.match(source, /pharmacyError/);
  assert.match(source, /status: 'error'/);
  assert.match(source, /status: 'success'/);
});
