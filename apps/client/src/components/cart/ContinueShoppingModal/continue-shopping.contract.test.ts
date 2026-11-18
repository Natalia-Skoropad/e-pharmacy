import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('continue shopping uses filter metadata, pagination and independent errors', async () => {
  const source = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/cart/ContinueShoppingModal/ContinueShoppingModal.tsx'
    ),
    'utf8'
  );

  assert.match(source, /getProductFilters/);
  assert.match(source, /PRODUCTS_PER_PAGE = 24/);
  assert.match(source, /page,/);
  assert.match(source, /Load more/);
  assert.match(source, /categoryError/);
  assert.match(source, /productError/);
  assert.match(source, /addError/);
  assert.doesNotMatch(source, /PRODUCTS_LIMIT = 150/);
});

//===================================================================

test('continue shopping matches the shared pharmacy picker UI and current stock model', async () => {
  const [source, styles] = await Promise.all([
    readFile(
      path.resolve(
        process.cwd(),
        'src/components/cart/ContinueShoppingModal/ContinueShoppingModal.tsx'
      ),
      'utf8'
    ),

    readFile(
      path.resolve(
        process.cwd(),
        'src/components/cart/ContinueShoppingModal/ContinueShoppingModal.module.css'
      ),
      'utf8'
    ),
  ]);

  assert.match(source, /InfoTooltip/);
  assert.match(source, /CategoryIcon/);
  assert.match(source, /categorySkeletons/);
  assert.match(source, /visibleItemsCount\.toLocaleString/);
  assert.match(source, /ProfileResourceState/);
  assert.match(source, /product\.availableQuantity/);
  assert.match(source, /inCartItem\?\.quantity/);
  assert.match(source, /getRemainingCartStock/);
  assert.match(source, /pendingOfferIds\.size > 0/);
  assert.match(source, /LoaderCircle/);
  assert.match(styles, /--modal-overflow: auto/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /flex-direction: column-reverse/);
  assert.match(styles, /grid-template-columns: 64px minmax\(0, 1fr\) 108px/);
  assert.match(styles, /\.productActions \{[^}]*grid-column: auto/);
  assert.match(styles, /\.productPrice \{[^}]*text-align: right/);
  assert.match(source, /toast.success/);
});
