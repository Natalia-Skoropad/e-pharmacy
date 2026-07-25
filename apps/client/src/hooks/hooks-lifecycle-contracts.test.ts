import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

async function readSource(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

//===================================================================

test('favorite refresh is user-scoped, abortable, and has no global promise cache', async () => {
  const source = await readSource('./useFavoriteStatusRefresh.ts');
  const refresh = await readSource('./useFavoriteRefresh.ts');

  assert.match(source, /\[id, user\?\.id\]/);
  assert.doesNotMatch(source, /favoriteProductIdsPromise|favoritePharmacyIdsPromise/);
  assert.match(refresh, /new AbortController\(\)/);
  assert.match(refresh, /controller\.abort\(\)/);
});

//===================================================================

test('favorite, review, and checkout mutations use synchronous locks', async () => {
  const favorite = await readSource('./useFavoriteActions.ts');
  const review = await readSource('./useReviewForm.ts');
  const checkout = await readSource(
    '../components/checkout/hooks/useCheckoutSubmit.ts'
  );

  assert.match(favorite, /activeMutationRef\.current/);
  assert.match(review, /submitLockRef\.current/);
  assert.match(checkout, /submitLockRef\.current/);
  assert.match(checkout, /AbortController/);
});

//===================================================================

test('cart state is isolated by identity and mutation generation', async () => {
  const provider = await readSource('../providers/CartProvider/CartProvider.tsx');
  const mutations = await readSource('../lib/cart/useCartMutations.ts');

  assert.match(provider, /clientIdentity/);
  assert.match(provider, /loadGenerationRef/);
  assert.match(provider, /controller\.abort\(\)/);
  assert.match(mutations, /mutationVersionRef/);
  assert.match(mutations, /isCurrentMutation/);
});

//===================================================================

test('client network effects no longer use mounted flags as cancellation', async () => {
  const files = await Promise.all([
    readSource('../components/profile/ProfilePageContent/ProfilePageContent.tsx'),
    readSource(
      '../components/profile/OrderDetailsPageContent/OrderDetailsPageContent.tsx'
    ),
    readSource(
      '../components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
    ),
    readSource(
      '../components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
    ),
  ]);

  for (const source of files) {
    assert.doesNotMatch(source, /let (?:isMounted|isCancelled) =/);
  }

  assert.ok(files.every((source) => source.includes('AbortController')));
});
