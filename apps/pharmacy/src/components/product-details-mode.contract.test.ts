import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('product details route semantics are represented by one all/own mode contract', async () => {
  const [details, ownWrapper] = await Promise.all([
    read(
      'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx'
    ),
  ]);

  assert.match(details, /type ProductDetailsMode = 'all' \| 'own'/);
  assert.match(details, /mode: ProductDetailsMode/);
  assert.match(details, /\n  mode,\n/);
  assert.match(details, /PRODUCT_DETAILS_MODE_CONFIG\[mode\]/);

  assert.match(
    details,
    /all:[\s\S]*showAddAction: true[\s\S]*showRemoveAction: false/
  );

  assert.match(
    details,
    /own:[\s\S]*showAddAction: false[\s\S]*showRemoveAction: true/
  );

  assert.doesNotMatch(
    details,
    /showAddAction\?:|showRemoveAction\?:|backHref\?:|backLabel\?:|bannerTitle\?:|bannerMessage\?:/
  );

  assert.match(
    ownWrapper,
    /<AllProductDetailsPageContent productId=\{productId\} mode="own" \/>/
  );
});

//===================================================================

test('product stock summary never turns a missing or locked offer into believable zero values', async () => {
  const details = await read(
    'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
  );

  const helperStart = details.indexOf(
    'function getSingleProductStatisticsCounts('
  );

  const helperEnd = details.indexOf(
    '//===================================================================',
    helperStart + 10
  );

  const helper = details.slice(helperStart, helperEnd);

  assert.match(helper, /if \(!offer\) return null/);
  assert.doesNotMatch(helper, /inStock:\s*\{\s*quantity:\s*0/);

  assert.match(
    details,
    /getSingleProductStatisticsCounts\(\s*currentOffer,\s*stockBalance\s*\)/
  );

  assert.doesNotMatch(
    details,
    /getSingleProductStatisticsCounts\(\s*bannerStatus \? null/
  );
});
