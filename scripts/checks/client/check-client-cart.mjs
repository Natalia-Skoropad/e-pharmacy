import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

//===================================================================

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

//===================================================================

for (const removedPath of [
  'apps/client/src/lib/cart/useCartMutations.ts',
  'apps/client/src/lib/cart/cart-commands.ts',
  'apps/client/src/lib/cart/cart-events.ts',
]) {
  assert.equal(
    await exists(removedPath),
    false,
    `${removedPath} must be deleted.`
  );
}

const provider = await read(
  'apps/client/src/providers/CartProvider/CartProvider.tsx'
);

for (const contract of [
  'createCartMutationQueue',
  'createInitialCartState',
  'beginCartLoad',
  'completeCartLoad',
  'failCartLoad',
  'refreshCart: performCartLoad',
  'retryCart: performCartLoad',
  'removeCartItemsSequentially',
  'mutationQueue.close',
]) {
  assert.match(provider, new RegExp(contract));
}

assert.doesNotMatch(provider, /mutationVersionRef|CART_UPDATED_EVENT/);
assert.doesNotMatch(provider, /return EMPTY_CART;\s*\/\/.*abort/s);

const clientSources = [
  'apps/client/src/components/cart/CartPageContent/CartPageContent.tsx',
  'apps/client/src/components/cart/ContinueShoppingModal/ContinueShoppingModal.tsx',
  'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx',
  'apps/client/src/components/checkout/hooks/useCheckoutSubmit.ts',
];

for (const relativePath of clientSources) {
  const source = await read(relativePath);
  assert.doesNotMatch(source, /cart-events|cart-commands|useCartMutations/);
}

const cartApi = await read('apps/client/src/lib/api/browser/cart.api.ts');

for (const operation of [
  'addCartItem',
  'updateCartItem',
  'removeCartItem',
  'clearCart',
]) {
  assert.match(cartApi, new RegExp(`export function ${operation}`));
}

assert.match(cartApi, /MutationRequestOptions/);
assert.match(cartApi, /\.\.\.options/);
assert.doesNotMatch(cartApi, /JsonResponseRequestOptions/);

console.log(
  'Client cart check passed (state machine, serialized mutations, abortable API writes, no event/wrapper layer).'
);
