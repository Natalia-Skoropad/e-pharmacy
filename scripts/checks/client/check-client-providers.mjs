import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const providersRoot = path.join(root, 'apps/client/src/providers');

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

async function collectProviderFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectProviderFiles(target)));
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(target);
    }
  }

  return files;
}

//===================================================================

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

//===================================================================

const composition = await read('apps/client/src/providers/ClientProviders.tsx');

const stack = await read('apps/client/src/providers/client-provider-stack.tsx');

for (const binding of [
  'ToastProvider={ToastProvider}',
  'AuthProvider={AuthProvider}',
  'FavoritesProvider={FavoritesProvider}',
  'CartProvider={CartProvider}',
]) {
  assert.match(composition, new RegExp(binding.replace(/[{}]/g, '\\$&')));
}

const authIndex = stack.indexOf('<AuthProvider>');
const favoritesIndex = stack.indexOf('<FavoritesProvider>');
const cartIndex = stack.indexOf('<CartProvider>');

assert.ok(authIndex >= 0, 'ClientProviderStack must include AuthProvider.');

assert.ok(
  favoritesIndex > authIndex,
  'FavoritesProvider must be nested below AuthProvider.'
);

assert.ok(
  cartIndex > favoritesIndex,
  'CartProvider must be nested below FavoritesProvider.'
);

const rootLayout = await read('apps/client/src/app/layout.tsx');
assert.match(rootLayout, /<ClientProviders>/);

assert.doesNotMatch(
  rootLayout,
  /<(?:AuthProvider|FavoritesProvider|CartProvider|ToastProvider)>/
);

const authProvider = await read(
  'apps/client/src/providers/AuthProvider/AuthProvider.tsx'
);

assert.match(authProvider, /bootstrapMode="always"/);
assert.match(authProvider, /ClientSessionScopeProvider/);

const favoritesProvider = await read(
  'apps/client/src/providers/FavoritesProvider/FavoritesProvider.tsx'
);

const cartProvider = await read(
  'apps/client/src/providers/CartProvider/CartProvider.tsx'
);

for (const [name, source] of [
  ['FavoritesProvider', favoritesProvider],
  ['CartProvider', cartProvider],
]) {
  assert.match(source, /useClientSessionScope/);
  assert.doesNotMatch(
    source,
    /from\s+['"]@\/hooks['"]/,
    `${name} must use a leaf hook import instead of the broad hooks barrel.`
  );
}

assert.match(favoritesProvider, /createFavoriteCollectionRequestRegistry/);
assert.match(favoritesProvider, /activeMutationsRef/);
assert.match(cartProvider, /createCartMutationQueue/);
assert.match(cartProvider, /createInitialCartState/);
assert.match(cartProvider, /mutationQueue\.close/);

for (const removedContract of [
  /CART_UPDATED_EVENT/,
  /dispatchCartUpdated/,
  /invalidateCart/,
  /mutationVersionRef/,
]) {
  assert.doesNotMatch(favoritesProvider, removedContract);
  assert.doesNotMatch(cartProvider, removedContract);
}

for (const removedPath of [
  'apps/client/src/lib/cart/cart-events.ts',
  'apps/client/src/lib/cart/cart-commands.ts',
  'apps/client/src/lib/cart/useCartMutations.ts',
]) {
  assert.equal(
    await exists(removedPath),
    false,
    `${removedPath} must stay deleted.`
  );
}

for (const testPath of [
  'apps/client/src/providers/ClientProviders.react.test.tsx',
  'apps/client/src/providers/AuthProvider/client-session-lifecycle.test.ts',
  'apps/client/src/providers/FavoritesProvider/favorite-collection-request-registry.test.ts',
  'apps/client/src/lib/cart/cart-state.test.ts',
  'apps/client/src/lib/cart/cart-mutation-queue.test.ts',
]) {
  assert.equal(
    await exists(testPath),
    true,
    `Missing provider test: ${testPath}.`
  );
}

const providerFiles = await collectProviderFiles(providersRoot);

console.log(
  `Client providers check passed (${providerFiles.length} provider modules, enforced Auth → Favorites → Cart ownership order, session-scoped state, no event loop).`
);
