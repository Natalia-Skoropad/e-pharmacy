import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('hybrid pharmacy routes fail closed for malformed entity ids before mounting detail clients', async () => {
  const routePairs = [
    [
      'src/app/pharmacy/orders/[[...filters]]/page.tsx',
      'src/app/pharmacy/orders/[orderId]/page.tsx',
    ],
    [
      'src/app/pharmacy/products/[[...filters]]/page.tsx',
      'src/app/pharmacy/products/[productId]/page.tsx',
    ],
    [
      'src/app/pharmacy/all-products/[[...filters]]/page.tsx',
      'src/app/pharmacy/all-products/[productId]/page.tsx',
    ],
    [
      'src/app/pharmacy/product-requests/[[...filters]]/page.tsx',
      'src/app/pharmacy/product-requests/[requestId]/page.tsx',
    ],
  ] as const;

  for (const [catchAllPath, detailPath] of routePairs) {
    const [catchAllSource, detailSource] = await Promise.all([
      read(catchAllPath),
      read(detailPath),
    ]);

    for (const source of [catchAllSource, detailSource]) {
      assert.match(source, /isValidObjectId/);
      assert.match(source, /notFound\(\)/);
    }

    assert.match(catchAllSource, /segments\?\.length === 1/);
  }
});

//===================================================================

test('client hybrid route resolver accepts only canonical filters or valid ObjectIds', async () => {
  const source = await read('src/lib/clients/client-paths.ts');

  assert.match(source, /isClientsFilterRoute\(segments\)/);

  assert.match(
    source,
    /segments\.length === 1 && isValidObjectId\(segments\[0\]\)/
  );

  assert.match(source, /return \{ kind: 'invalid' \}/);
});
