import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('product list landmarks use human-readable labels and valid page title references', async () => {
  const [allProducts, ownProducts, productRequests] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  assert.match(allProducts, /aria-label="Search and filter all products"/);
  assert.match(ownProducts, /aria-label="Search and filter own products"/);

  assert.match(
    productRequests,
    /<main[^>]+aria-labelledby="product-requests-page-title"/
  );

  assert.match(
    productRequests,
    /aria-label="Search and filter product requests"/
  );

  assert.doesNotMatch(
    productRequests,
    /aria-label="product-requests-page-title"/
  );

  assert.doesNotMatch(
    productRequests,
    /aria-labelledby="product-requests-page"/
  );
});

//===================================================================

test('product detail composition does not expose implementation names as accessible copy', async () => {
  const source = await read(
    'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
  );

  assert.match(source, /aria-label="Product summary"/);
  assert.match(source, /ariaLabel="Product details sections"/);
  assert.doesNotMatch(source, /aria-labelledby="product-summary-title"/);

  assert.doesNotMatch(
    source,
    /(?:aria-label|ariaLabel|label|placeholder|title|message|kicker|emptyText|eyebrow)=\"[^\"]*ProductDetails/
  );
});

//===================================================================

test('article availability is announced as an async status without duplicating shared tab keyboard logic', async () => {
  const source = await read(
    'src/components/product-requests/NewProductRequestPageContent/NewProductRequestPageContent.tsx'
  );

  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /<Tabs[\s\S]+?ariaLabel="Product request sections"/);
  assert.doesNotMatch(source, /onKeyDown=.*Arrow(?:Left|Right)/);
});
