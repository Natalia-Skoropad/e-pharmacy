import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const componentPath = path.resolve(
  process.cwd(),
  'src/components/orders/OrderDetailsPageContent/OrderDetailsPageContent.tsx'
);

//===================================================================

test('Order details never renders raw transport or backend Error.message values', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.doesNotMatch(source, /instanceof Error\s*&&\s*\w+\.message/);
  assert.doesNotMatch(source, /Authorization token is invalid/);

  const safeMapperCalls = source.match(/getSafeApiErrorMessage\(/g) ?? [];
  assert.ok(safeMapperCalls.length >= 4);
});
